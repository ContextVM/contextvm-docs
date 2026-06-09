---
title: Client payments
description: Configure handlers, PMI support, and client behavior for CEP-8 paid servers
---

# Client payments

Client payments are implemented as middleware around your client transport.

When a server replies with `notifications/payment_required`, the payments layer:

1. selects a `PaymentHandler` for the PMI
2. asks the handler to pay `pay_req`
3. continues waiting for the original request completion

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
