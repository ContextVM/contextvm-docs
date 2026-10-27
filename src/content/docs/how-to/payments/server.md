---
title: Configure ContextVM Server Payments
description: Price ContextVM capabilities, select payment processors, and reject or waive requests before execution.
---

# Configure ContextVM server payments

## Prerequisites and tested version

The examples target `@contextvm/sdk` 0.14.3. Complete [Run a Lightning-paid ContextVM tool](/how-to/payments/getting-started) first if you need a working transport, processor, and client.

Server payments are implemented as middleware that sits between:

- the inbound client request, and
- the underlying MCP server handler.

For priced requests, the middleware ensures **no unpaid forwarding**.

## Deployment and payment state

The atomic payment state API requires a build containing [SDK PR #110](https://github.com/ContextVM/sdk/pull/110) until a release includes it.

**One paying server identity = one process with the default store.** `InMemoryPaymentStateStore` cannot coordinate payments across processes or preserve state after restart. Use the same `stateStore` instance for all payment middleware serving that identity within the process. The SDK bundles no database adapter or driver.

Restarting loses invoice bindings, unclaimed grants, and replay records. Reconcile outstanding payments before resuming payment processing; a missing record is not evidence that an invoice was unpaid. An expired unclaimed grant remains retained and returns `error.data.reason: 'payment_expired'`; contact the server operator to reconcile it before paying again.

### Inject an application-owned backend

```ts
import {
  InMemoryPaymentStateStore,
  withServerPayments,
  type PaymentStateStore,
} from '@contextvm/sdk/payments';

const stateStore: PaymentStateStore = new InMemoryPaymentStateStore();
withServerPayments(transport, { processors: [processor], pricedCapabilities, stateStore });
```

Replace the in-memory instance with your own implementation when persistence or cross-process coordination is required. Keep each paying server identity in a separate store or backend namespace. The contract requires:

- `policy`: consistent capacity and replay-admission limits for that identity.
- `admit`: one atomic admission/reservation/grant claim, including replay and capacity checks.
- `transition`: an atomic, generation-fenced state change.
- `read`: a snapshot that callers cannot mutate to change stored state.

Initialize and close custom backends in your application; the SDK owns neither their connections nor their dependencies. Backend errors propagate without falling back to a fresh memory store. Choose persistence, atomicity, retention, and shutdown behavior explicitly when implementing the contract.

Settlement and paid-result recovery in [SDK PR #112](https://github.com/ContextVM/sdk/pull/112) use the same injected store. With the default store, a replacement transport can retry a retained result while that store remains alive. A new process or a new in-memory store cannot recover the old result. Cross-process or restart recovery requires an application-provided backend that preserves the complete record and its atomic transitions. A published result is not proof of client receipt.

## Priced capability matching

You price individual capabilities by `method` + `name`.

```ts
import type { PricedCapability } from '@contextvm/sdk/payments';

const pricedCapabilities: PricedCapability[] = [
  { method: 'tools/call', name: 'add', amount: 10, currencyUnit: 'sats' },
  {
    method: 'resources/read',
    name: 'private://*',
    amount: 5,
    currencyUnit: 'sats',
  },
];
```

Notes:

- Only requests that match a priced capability are gated.
- Matching is designed for predictable policy. Prefer explicit entries over overly-broad wildcards.

## Processors (server-side payment rails)

A `PaymentProcessor` is responsible for:

- creating a `pay_req` for a given amount
- verifying that a previously issued `pay_req` has been paid

You can configure multiple processors (multiple PMIs). The server selects a processor based on client/server PMI compatibility.

In builds containing SDK PR #110, client and server validation accept non-empty PMI strings up to 2048 characters, including HTTPS method identifiers and existing custom rail names. Identifiers match exactly; the SDK does not normalize or rewrite them.

```ts
import {
  LnBolt11NwcPaymentProcessor,
  withServerPayments,
} from '@contextvm/sdk/payments';

const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
});

withServerPayments(transport, {
  processors: [processor],
  pricedCapabilities,
});
```

`paymentTtlMs` bounds invoice creation and verification in milliseconds. Set it to at least the processor's invoice lifetime in seconds multiplied by 1000, with headroom for pricing and invoice creation. Align the actual wallet invoice expiry with this window: a wallet can accept a late payment after SDK verification has stopped. `authorizationTtlMs` separately controls how long a verified explicit-gating grant can be claimed.

## Payment interaction policy (`paymentInteraction`)

`withServerPayments` accepts a `paymentInteraction` policy of type `'optional' | 'transparent'`:

- `'optional'` **(default)**: the server advertises `explicit_gating` support and mirrors each client's requested lifecycle. Clients that request `explicit_gating` are gated; transparent clients keep the notification flow.
- `'transparent'`: transparent-only. A client that requests `explicit_gating` receives a `-32602` negotiation error.

```ts
withServerPayments(transport, {
  processors: [processor],
  pricedCapabilities,
  paymentInteraction: 'transparent', // restrict to the notification flow
});
```

:::caution[Behavioral change in 0.13.0]
The default changed from implicit transparent-only to `'optional'`. A server that accepts payments now **also accepts `explicit_gating` requests** from clients that ask for it. Pass `paymentInteraction: 'transparent'` to restore the previous behavior.
:::

Under `'optional'`, priced requests are routed to exactly one lifecycle per session based on the negotiated mode. For the explicit-gating end-to-end setup, see [Explicit payment gating](/how-to/payments/explicit-gating). For the API reference, see [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating).

## Dynamic pricing: `resolvePrice`

`resolvePrice` runs on every priced request and returns the final quote.

```ts
import type { ResolvePriceFn } from '@contextvm/sdk/payments';

const resolvePrice: ResolvePriceFn = async ({
  capability,
  request,
  clientPubkey,
}) => {
  // Example: price based on request size.
  const requestSize = JSON.stringify(request.params ?? {}).length;
  const extra = Math.ceil(requestSize / 1024);
  const amount = Math.max(1, Math.round(capability.amount + extra));

  return {
    amount,
    description: `Request size: ${requestSize} bytes`,
    meta: { requestSize },
  };
};

withServerPayments(transport, {
  processors: [processor],
  pricedCapabilities,
  resolvePrice,
});
```

The quote object uses `meta` (not `_meta`); it is merged into the emitted payment request's `_meta`. Prefer the `quotePrice`, `rejectPrice`, and `waivePrice` helper factories over raw object literals — the `reject: true` / `waive: true` discriminants are easy to mistype.

Guidance:

- Keep it fast and deterministic.
- Treat it like authorization + pricing logic.
- Keep usage/quota state shared as required by your application; a shared quota database alone does not coordinate payment admission across processes.

## Rejecting requests without charging

To reject a priced request without creating an invoice, return `{ reject: true, message? }` from `resolvePrice`.

```ts
import type { ResolvePriceFn } from '@contextvm/sdk/payments';

const resolvePrice: ResolvePriceFn = async ({ capability, clientPubkey }) => {
  const isBlocked = await isUserBlocked(clientPubkey);
  if (isBlocked) {
    return { reject: true, message: 'Access denied' };
  }

  return { amount: capability.amount };
};
```

When rejected:

- the server emits `notifications/payment_rejected` correlated to the request
- no processor method is called
- the request is not forwarded

## Waiving payment (prepaid / subscription)

To waive payment and allow the request to proceed without creating an invoice, return `{ waive: true }` from `resolvePrice`.

```ts
const resolvePrice: ResolvePriceFn = async ({ capability, clientPubkey }) => {
  const hasPrepaid = await checkPrepaidBalance(clientPubkey);
  if (hasPrepaid) {
    return { waive: true };
  }
  return { amount: capability.amount };
};
```

When waived:

- no `notifications/payment_required` is emitted
- no processor method is called
- the request is forwarded immediately

## Notifications and correlation

Payment notifications are correlated to the original request using an `e` tag (the request event id).

- `notifications/payment_required`
- `notifications/payment_accepted`
- `notifications/payment_rejected`

This is how clients know which in-flight request a payment notification belongs to.

:::note
Notification correlation applies to the **transparent** lifecycle. In `explicit_gating` mode the server returns `-32042` / `-32043` JSON-RPC invocation errors instead of notifications. Enable it per session from the client side; see [Explicit payment gating](/how-to/payments/explicit-gating).
:::
