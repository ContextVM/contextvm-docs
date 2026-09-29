---
title: Configure Lightning Payments with NWC
description: Set up BOLT11 invoice creation, payment, and settlement verification for ContextVM using Nostr Wallet Connect.
---

# Configure Lightning payments with NWC

The built-in Lightning rail uses BOLT11 invoices and Nostr Wallet Connect (NIP-47). Its payment method identifier (PMI) is `bitcoin-lightning-bolt11`.

## Prerequisites and tested version

The examples target `@contextvm/sdk` 0.14.3. Start with [Run a Lightning-paid ContextVM tool](/how-to/payments/getting-started) if you need the complete server and client setup.

Use separate, limited NWC connections:

- the server wallet needs `make_invoice` and `lookup_invoice`; `notifications` is optional
- the client wallet needs `pay_invoice`

Treat both connection strings as wallet credentials. Load them from environment variables and keep them out of source control and logs.

## Server processor

```ts
import { LnBolt11NwcPaymentProcessor } from "@contextvm/sdk/payments";

const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
});
```

The processor creates an invoice for each priced request. On first use, it checks whether the wallet advertises `payment_received` notifications. It uses those notifications when available and falls back to `lookup_invoice` polling when they are unavailable.

If a wallet advertises notifications but does not deliver them reliably, force polling:

```ts
const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
  enableNotificationVerification: false,
});
```

Do not set `enableNotificationVerification: true` unless the wallet supplies a `payment_hash` when creating the invoice and reliably sends `payment_received` notifications.

## Client handler

```ts
import { LnBolt11NwcPaymentHandler } from "@contextvm/sdk/payments";

const handler = new LnBolt11NwcPaymentHandler({
  nwcConnectionString: process.env.NWC_CLIENT_CONNECTION!,
});
```

The handler calls the wallet's `pay_invoice` method after the client policy approves a correlated payment request.

## Observable outcomes

| Signal                             | Meaning                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `notifications/payment_required`   | The server issued an invoice and is waiting for settlement.                     |
| `NWC pay_invoice failed: ...`      | The client wallet rejected or failed the payment request.                       |
| `notifications/payment_accepted`   | The server verified settlement; delivery is best effort.                        |
| Tool handler output and MCP result | The paid request was forwarded and completed. This is the final success signal. |
| `notifications/payment_rejected`   | The server rejected the request before issuing an invoice.                      |

## Operational checks

- Keep the processor TTL longer than the wallet and relay round trip.
- Reuse relay handlers when the application already owns connected pools.
- Check wallet permissions and balance before increasing timeouts.
- Correlate payment notifications with the original request event ID.
- Check settlement before retrying an uncertain paid request.
