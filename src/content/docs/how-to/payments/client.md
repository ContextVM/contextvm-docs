---
title: Control ContextVM Client Payments
description: Configure payment handlers, spending policy, PMI selection, and explicit gating for paid ContextVM calls.
---

# Control ContextVM client payments

## Prerequisites and tested version

The examples target `@contextvm/sdk` 0.14.3. Complete [Run a Lightning-paid ContextVM tool](/how-to/payments/getting-started) first if you need a working paid call.

Client payments are implemented as middleware around your client transport.

When a server replies with `notifications/payment_required`, the payments layer:

1. selects a `PaymentHandler` for the PMI
2. asks the handler to pay `pay_req`
3. continues waiting for the original request completion

This is the default **transparent** lifecycle. CEP-8 also defines an opt-in **explicit gating** lifecycle where payment is surfaced as `-32042` / `-32043` invocation errors — see [Explicit payment gating](#explicit-payment-gating).

## Handlers

A `PaymentHandler` implements one PMI (one payment rail). The built-in handler supports Lightning BOLT11 over NWC.

```ts
import {
  LnBolt11NwcPaymentHandler,
  withClientPayments,
} from '@contextvm/sdk/payments';

const handler = new LnBolt11NwcPaymentHandler({
  nwcConnectionString: process.env.NWC_CLIENT_CONNECTION!,
});

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
});
```

## PMI advertisement (`pmi` tags)

CEP-8 allows clients to advertise which PMIs they can pay by including `pmi` tags on requests.

Why it matters:

- If the server supports multiple PMIs, your tags help it select a compatible one.
- The order expresses preference (first = most preferred).

When you wrap a transport with `withClientPayments(...)`, the SDK will automatically inject `pmi` tags derived from your configured handler list.

## Payment rejection

If the server rejects a request without charging, it emits `notifications/payment_rejected` correlated to the request.

This is a policy outcome (no invoice, no settlement).

Your app should typically:

- stop retrying the same request (unless the policy might change)
- surface the optional message to users/operators

## Client-side payment policy (`paymentPolicy`)

You can optionally intercept `notifications/payment_required` locally and decide whether the client should proceed with payment.

This is designed for:

- interactive UX (UI prompts)
- LLM-driven consent
- headless "Code Mode" policies (budgets / allowlists)

```ts
import {
  withClientPayments,
  type PaymentHandlerRequest,
} from '@contextvm/sdk/payments';

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  paymentPolicy: async (req: PaymentHandlerRequest, ctx): Promise<boolean> => {
    // ctx?.method examples: "tools/call", "prompts/get", "resources/read"
    // ctx?.capability examples: "tool:add", "prompt:welcome", "resource:greeting://alice"
    if (req.amount > 500) return false;
    if (ctx?.capability === 'tool:expensive_tool') return false;
    return true;
  },
});
```

### Decline behavior (fail-fast)

When `paymentPolicy` returns `false`, the SDK will **fail the original request immediately** (instead of hanging until timeout) on transports that support correlation (such as `NostrClientTransport`).

The synthesized JSON-RPC error uses:

- `error.code = -32000`
- `error.message = "Payment declined by client policy"`
- `error.data` includes `{ pmi, amount, method, capability }` when available

Similarly, if a handler's `canHandle` returns `false`, the SDK will fail-fast with `"Payment declined by client handler"` when correlation exists.

## Bound automatic payments and attempt history

These controls require the client lifecycle changes in [SDK PR #108](https://github.com/ContextVM/sdk/pull/108). Use a build containing that PR until a release includes it.

```ts
const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  limits: {
    maxAmountByPmi: { 'bitcoin-lightning-bolt11': 500 },
    maxAttempts: 2,
    timeoutMs: 60_000,
  },
  maxTrackedPaymentAttempts: 1000,
});
```

`limits` applies to one original invocation, including automatic retries and replacement invoices:

- `maxAmountByPmi` caps the cumulative advertised amount approved for each PMI, in that rail's amount unit. When provided, unlisted PMIs cannot be paid automatically. Explicit callbacks reserve the largest offered amount per PMI and must pay only one supplied option. Handlers must verify the actual invoice amount before paying.
- `maxAttempts` caps distinct offers passed to policy or approval work. Zero refuses automatic payment. Repeated offers found in retained history do not consume another attempt.
- `timeoutMs` starts at the first payment offer or pending response. Expiry aborts the invocation and prevents further automatic wallet work or retries.

These limits require a correlated original request. Amount or attempt exhaustion returns `error.data.reason: 'payment_limit_exceeded'`; deadline expiry returns `'payment_deadline_exceeded'`. Omitted limits impose no corresponding bound.

`maxTrackedPaymentAttempts` bounds payment identities across the wrapper, separately from invocation limits. The default is 1000; zero refuses new automatic payments. Each distinct PMI plus `pay_req` consumes one entry, including every option supplied to an explicit approval callback. In-flight and unknown attempts stay pinned. Under pressure, the least recently used handled or declined identities are evicted. Deduplication for those terminal identities ends when they are evicted; handler completion records a local wallet result, not receiver settlement.

If unresolved pins and the new offered options cannot fit, the wrapper returns `'payment_attempt_capacity'` before invoking approval or wallet code. An unknown retained outcome returns `'payment_outcome_unknown'` on a repeated offer. Reconcile uncertain payments with the wallet and receiver before authorizing another payment; cancellation or recreating the transport does not establish that an invoice was unpaid.

## Check cancellation before wallet actions

`PaymentHandlerRequest.abortSignal` is aborted when the request completes, is cancelled, reaches its payment deadline, or the transport closes. The wrapper supplies it to `paymentPolicy`, `canHandle`, and `handle`. Check it after awaiting user approval and immediately before calling the wallet; pass it to wallet APIs that support cancellation.

```ts
import type { PaymentHandler } from '@contextvm/sdk/payments';

const approvalHandler: PaymentHandler = {
  pmi: handler.pmi,
  async handle(req): Promise<void> {
    req.abortSignal?.throwIfAborted();
    const approved = await askUserToApprove(req);
    req.abortSignal?.throwIfAborted();
    if (!approved) throw new Error('Payment not approved');
    await handler.handle(req);
  },
};
```

Register `approvalHandler` instead of `handler` to use this approval step. `askUserToApprove` represents your application's approval UI. Use `paymentPolicy` or `canHandle` to record a refusal before wallet work; a rejected `handle` call is treated as an unknown outcome because a wallet action might already have occurred.

The explicit `onPaymentRequired` callback also receives `abortSignal`; check it after approval and before paying one option. Aborting stops future work and retries, but cannot undo a wallet action already submitted. A late callback cannot revive the completed request.

## Multiple handlers

You can configure multiple handlers if you support multiple payment rails.

```ts
const paidTransport = withClientPayments(baseTransport, {
  handlers: [
    lightningHandler,
    // futureHandler,
  ],
});
```

The first handler that matches the server-selected PMI is used.

## Explicit payment gating

For AI agents and applications that need payment surfaced as invocation errors (`-32042` / `-32043`) instead of notifications, request the `explicit_gating` lifecycle. **No callback is required** — the `-32042 Payment Required` error (with `instructions` + `payment_options`) reaches the caller directly, so the agent reads it, pays `pay_req`, and retries the same call.

```ts
const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  paymentInteraction: 'explicit_gating',
});
```

See [Explicit payment gating](/how-to/payments/explicit-gating) for the end-to-end agent flow (read the error, pay, retry), the optional auto-retry callback, and negotiation-failure handling.
