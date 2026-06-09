---
title: Lightning over NWC
description: Use Lightning BOLT11 invoices via Nostr Wallet Connect (NIP-47) for CEP-8 payments
---

# Lightning over NWC

The SDK includes a Lightning payment rail using **BOLT11 invoices** and **Nostr Wallet Connect (NIP-47)**.

PMI: `bitcoin-lightning-bolt11`

Components:

- Server: `LnBolt11NwcPaymentProcessor`
- Client: `LnBolt11NwcPaymentHandler`

## What is NWC?

NWC is a standard connection mechanism for asking a wallet to perform actions (like paying invoices) via Nostr.
In practice, both the server and the client will have an NWC connection string.

## Configuration

### Server processor

```ts
import { LnBolt11NwcPaymentProcessor } from '@contextvm/sdk/payments';

const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
});
```

The server-side NWC wallet must be able to **create invoices** and support whatever verification strategy the processor uses.

### Client handler

```ts
import { LnBolt11NwcPaymentHandler } from '@contextvm/sdk/payments';

const handler = new LnBolt11NwcPaymentHandler({
  nwcConnectionString: process.env.NWC_CLIENT_CONNECTION!,
});
```

The client-side NWC wallet must be able to **pay invoices**.

## Operational notes

- Keep NWC connection strings secret (treat them like wallet credentials).
- Use separate wallets/permissions for server and client roles.
- In production, tune polling/TTL options on the processor/handler only if needed for your wallet/relay setup.

## Troubleshooting checklist

- `payment_required` never arrives: verify the capability is priced and the request matches `method` + `name`.
- `payment_required` arrives but payment fails: check the client wallet permissions / available balance.
- Payment happens but `payment_accepted` never arrives: verify server relay connectivity and processor verification settings.
