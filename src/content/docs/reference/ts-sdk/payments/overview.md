---
title: Payments (CEP-8)
description: Learn how to add payment handling to your ContextVM servers and clients using CEP-8
---

# Payments (CEP-8)

The ContextVM SDK provides a modular CEP-8 payment layer that allows servers to **charge for specific capabilities** (tools, resources, prompts) and clients to **pay automatically** when required.

Payments are implemented as **middleware** around transports, so your Nostr transport logic stays clean and payment rails stay pluggable.

At a glance:

- Servers configure **priced capabilities** and one or more **processors** (how to issue/verify payment requests)
- Clients configure one or more **handlers** (how to pay a payment request)
- The protocol uses correlated JSON-RPC notifications:
  - `notifications/payment_required` (server → client)
  - `notifications/payment_accepted` (server → client)
  - `notifications/payment_rejected` (server → client, “reject without charging”)

## Core Concepts

### Payment Method Identifier (PMI)

Each payment rail is identified by a **PMI** (Payment Method Identifier). A PMI is just a string like `bitcoin-lightning-bolt11`.

In CEP-8, the PMI is how the client and server agree on _how_ payment is settled.

The SDK currently ships a Lightning rail:

- `bitcoin-lightning-bolt11` - Lightning BOLT11 invoices via NWC (NIP-47) or LNbits

Under the hood, the built-in rail is implemented by:

- Server processor: `LnBolt11NwcPaymentProcessor`
- Client handler: `LnBolt11NwcPaymentHandler`

### Two Sides of Payments

Payments are symmetric:

1. **Server-side**: a `PaymentProcessor` creates payment requests (`pay_req`) and verifies settlement.
2. **Client-side**: a `PaymentHandler` executes payments when the server requires payment.

`pay_req` is treated as **opaque** by the SDK. Only the selected PMI module understands its encoding.

### Amounts: advertise vs. settle

CEP-8 separates discovery (“menu price”) from settlement (“what you actually charge”):

- You _advertise_ a price via `pricedCapabilities[].amount` + `currencyUnit`.
- You _settle_ via the chosen PMI’s processor. The processor encodes the settlement amount into `pay_req`.

Example: you can advertise in `usd` for transparency, but settle in sats if the chosen PMI is Lightning.

## Server: Charging for Capabilities

### Basic Setup

On the server you:

1. define which capabilities are priced
2. configure one or more processors
3. attach server payment middleware

```ts
import { withServerPayments } from '@contextvm/sdk/payments';

const paidTransport = withServerPayments(baseTransport, {
  processors: [processor],
  pricedCapabilities: [
    {
      method: 'tools/call',
      name: 'my-tool',
      amount: 10,
      currencyUnit: 'sats',
    },
  ],
});
```

Notes:

- `pricedCapabilities` is a set of patterns (method + name) that match incoming requests.
- The wrapper gates the request: priced requests are **not forwarded** to the underlying server until payment is verified.

### Dynamic Pricing with `resolvePrice`

Fixed prices are useful, but most production services want dynamic pricing. The `resolvePrice` callback lets you compute the **final quote** at request time.

Common cases:

- user-tier discounts
- request-size pricing
- promos/coupons
- converting an advertised currency unit (e.g. USD) into settlement units (e.g. sats)

```ts
import type { ResolvePriceFn } from '@contextvm/sdk/payments';

const resolvePrice: ResolvePriceFn = async ({ capability, clientPubkey }) => {
  // Example: give volume discounts
  const usageCount = await getUserUsageCount(clientPubkey);

  if (usageCount > 100) {
    return { amount: capability.amount * 0.5 }; // 50% off for power users
  }

  return { amount: capability.amount };
};
```

Important: the amount returned by `resolvePrice` must be in the unit your chosen processor expects.
For Lightning BOLT11 settlement, that means sats/msats according to the processor’s implementation.

### Rejecting Requests Without Charging

You can reject requests before asking for payment by returning `{ reject: true, message? }` from `resolvePrice`.

This is intentionally different from “payment required”: it’s a **policy decision** and there is **no invoice** created and no verification performed.

Typical use cases:

- one-call-per-user / one-time coupons
- quota exceeded
- blocked users / missing allowlist
- server-side validation failures you don’t want to charge for

```ts
import type { ResolvePriceFn } from '@contextvm/sdk/payments';

const usedCapabilities = new Set<string>(); // Track used capabilities per user

const resolvePrice: ResolvePriceFn = async ({
  capability,
  clientPubkey,
  request,
}) => {
  const key = `${clientPubkey}:${capability.method}:${capability.name}`;

  if (usedCapabilities.has(key)) {
    return {
      reject: true,
      message: 'This capability can only be used once per user',
    };
  }

  usedCapabilities.add(key);
  return { amount: capability.amount };
};
```

When rejected, the server emits `notifications/payment_rejected` instead of `notifications/payment_required`, and the request is not forwarded to the underlying server.

### What the server emits (notification flow)

Paid request:

```
Client Request
  → Server detects priced capability
    → notifications/payment_required (correlated to request)
      → Client pays using a handler
        → Server verifies using a processor
          → notifications/payment_accepted (correlated)
            → Server forwards request to underlying MCP server
```

Rejected request:

```
Client Request
  → Server resolvePrice returns { reject: true }
    → notifications/payment_rejected (correlated)
      → Request is NOT forwarded
```

### Waiving Payment (Prepaid / Subscription Models)

You can waive payment for a priced request by returning `{ waive: true }` from `resolvePrice`. The server forwards the request immediately without emitting `notifications/payment_required` or calling the processor.

This is useful for:

- Prepaid balances or top-up accounts
- Subscription-based access where payment is handled separately
- Internal users or allowlisted clients

```ts
import type { ResolvePriceFn } from '@contextvm/sdk/payments';

const resolvePrice: ResolvePriceFn = async ({ capability, clientPubkey }) => {
  const hasBalance = await checkPrepaidBalance(clientPubkey, capability.amount);
  if (hasBalance) {
    return { waive: true };
  }
  return { amount: capability.amount };
};
```

## Client: Paying for Capabilities

### Basic Setup

On the client you:

1. configure one or more handlers
2. attach client payment middleware

```ts
import { withClientPayments } from '@contextvm/sdk/payments';

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
});
```

When the server responds with `notifications/payment_required`, the payments layer:

1. chooses a handler by PMI
2. calls the handler to pay `pay_req`
3. continues the request flow once the server confirms via `notifications/payment_accepted`

### Handling Payment Rejection

When a server rejects a request, the client receives a `notifications/payment_rejected` notification correlated to the original request.

How you surface it is app-specific:

- UI clients might show the message as an error toast.
- Headless clients might treat it as a hard failure and stop retrying.

The important part: rejection happens **without charging** and without any processor/handler being invoked.

## Choosing a PMI (compatibility)

PMI selection is an intersection:

- Clients can advertise what they can pay (via `pmi` tags).
- Servers advertise what they can accept (based on configured processors).

If there is no overlap, the server cannot produce a usable `pay_req` for that client.

In practice, when you use payments wrappers, PMI advertisement is handled for you based on your configured handlers/processors.

## Operational guidance (production)

- Treat `resolvePrice` as part of your authorization layer: deterministic, fast, and side-effect aware.
- If you enforce quotas/one-time use, use a durable store (not an in-memory map) if you run multiple server instances.
- Keep settlement verification bounded: processors should have timeouts and should not poll indefinitely.

## Related

- [CEP-8 Specification](/spec/ceps/cep-8)
- [CEP-21: Payment Rejection](/spec/ceps/informational/cep-21)
- [Paid Servers and Clients Guide](/docs/payments-paid-servers-and-clients)

## Next steps

- [Getting started](./getting-started)
- [Server payments](./server)
- [Client payments](./client)
- [Lightning over NWC](./rails/lightning-nwc)
- [Build your own payment rail](./custom-rails)
