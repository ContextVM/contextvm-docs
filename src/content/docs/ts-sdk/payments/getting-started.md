---
title: Getting started
description: Quickstart for enabling CEP-8 payments on a ContextVM server and client
---

# Getting started

This page shows the smallest end-to-end setup:

- a server that charges for a single tool
- a client that can pay via Lightning BOLT11 over NWC

If you haven’t set up Nostr transports yet, start with the transport docs first.

## 1) Server: mark capabilities as priced

Define what is paid using `pricedCapabilities`.

```ts
import type { PricedCapability } from '@contextvm/sdk/payments';

export const pricedCapabilities: PricedCapability[] = [
  {
    method: 'tools/call',
    name: 'my-tool',
    amount: 10,
    currencyUnit: 'sats',
    description: 'Example paid tool',
  },
];
```

## 2) Server: attach payments middleware

Create a processor, then wrap your server transport.

```ts
import {
  LnBolt11NwcPaymentProcessor,
  withServerPayments,
} from '@contextvm/sdk/payments';
import { NostrServerTransport } from '@contextvm/sdk/transport';

const baseTransport = new NostrServerTransport({
  signer,
  relayHandler,
});

const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
});

const paidTransport = withServerPayments(baseTransport, {
  processors: [processor],
  pricedCapabilities,
});
```

Server behavior for priced requests:

1. emits `notifications/payment_required` (correlated to the request)
2. waits for settlement verification
3. emits `notifications/payment_accepted`
4. forwards the request to the underlying MCP server

## 3) Client: attach payments middleware

Create a handler and wrap your client transport.

```ts
import {
  LnBolt11NwcPaymentHandler,
  withClientPayments,
} from '@contextvm/sdk/payments';
import { NostrClientTransport } from '@contextvm/sdk/transport';

const baseTransport = new NostrClientTransport({
  signer,
  relayHandler,
  serverPubkey,
});

const handler = new LnBolt11NwcPaymentHandler({
  nwcConnectionString: process.env.NWC_CLIENT_CONNECTION!,
});

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
});
```

Now priced calls will automatically pay when required.

## 4) Try a paid call

Any request that matches `pricedCapabilities` will trigger the payment flow.

```ts
await client.callTool({
  name: 'my-tool',
  arguments: { example: true },
});
```

## What to read next

- [Server payments](./server)
- [Client payments](./client)
- [Lightning over NWC](./rails/lightning-nwc)
