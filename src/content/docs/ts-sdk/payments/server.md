---
title: Server payments
description: Configure priced capabilities, processors, dynamic pricing, and rejection on ContextVM servers
---

# Server payments

Server payments are implemented as middleware that sits between:

- the inbound client request, and
- the underlying MCP server handler.

For priced requests, the middleware ensures **no unpaid forwarding**.

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
    _meta: { requestSize },
  };
};

withServerPayments(transport, {
  processors: [processor],
  pricedCapabilities,
  resolvePrice,
});
```

Guidance:

- Keep it fast and deterministic.
- Treat it like authorization + pricing logic.
- If you run multiple server instances, store any usage/quota state in a durable store.

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
