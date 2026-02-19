---
title: Payments Integration
description: Implement CEP-8 payments in ContextVM using the @contextvm/sdk payments middleware.
---

# Payments Integration (CEP-8)

Implement CEP-8 payments to charge for specific capabilities and enable automatic client payments using the TypeScript SDK payments layer.

Payments are implemented as **middleware around transports**:

- **Server-side** middleware gates priced requests: it must not forward to the underlying MCP server until payment is verified
- **Client-side** middleware listens for payment notifications, executes a handler, then continues the original request

## Quick Start: Charge for One Tool

### Server: Price a Capability and Attach Payments

```typescript
import type { PricedCapability } from '@contextvm/sdk/payments';
import {
  LnBolt11NwcPaymentProcessor,
  withServerPayments,
} from '@contextvm/sdk/payments';

const pricedCapabilities: PricedCapability[] = [
  {
    method: 'tools/call',
    name: 'my-tool',
    amount: 10,
    currencyUnit: 'sats',
    description: 'Example paid tool',
  },
];

const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: process.env.NWC_SERVER_CONNECTION!,
});

const paidTransport = withServerPayments(baseTransport, {
  processors: [processor],
  pricedCapabilities,
});
```

### Client: Attach a Handler and Pay Automatically

```typescript
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

## Core Concepts

### Notifications and Correlation

CEP-8 payments are expressed as correlated JSON-RPC notifications:

- `notifications/payment_required`
- `notifications/payment_accepted`
- `notifications/payment_rejected` (CEP-21: reject without charging)

They are correlated to the original request via an `e` tag (request event id). Your app should treat these as **notifications**, not responses.

### PMI (Payment Method Identifier)

Each payment rail is identified by a **PMI** string (example: `bitcoin-lightning-bolt11`).

- Server processors advertise which PMIs they can accept
- Client handlers advertise which PMIs they can pay
- A payment only works if there is an intersection

### Amounts: Advertise vs Settle

`pricedCapabilities[].amount` + `currencyUnit` are what you *advertise* (discovery). The selected PMI determines how you *settle*.

If you use dynamic pricing via `resolvePrice`, the amount you return must match the unit expected by your chosen processor.

## Server Patterns

### Fixed Pricing

Set fixed prices via `pricedCapabilities`:

```typescript
const pricedCapabilities: PricedCapability[] = [
  {
    method: 'tools/call',
    name: 'generate-image',
    amount: 100,
    currencyUnit: 'sats',
    description: 'Generate an AI image',
  },
  {
    method: 'tools/call',
    name: 'analyze-data',
    amount: 50,
    currencyUnit: 'sats',
    description: 'Analyze dataset',
  },
];
```

### Dynamic Pricing

Use `resolvePrice` for dynamic pricing based on request parameters:

```typescript
const paidTransport = withServerPayments(baseTransport, {
  processors: [processor],
  pricedCapabilities: [], // Empty for dynamic
  resolvePrice: async (request) => {
    if (request.method === 'tools/call' && request.params?.name === 'custom-tool') {
      const complexity = request.params.arguments?.complexity || 1;
      return {
        amount: 10 * complexity,
        currencyUnit: 'sats',
        description: `Custom tool (complexity: ${complexity})`,
      };
    }
    return null; // No charge
  },
});
```

### Reject Without Charging (CEP-21)

Reject requests without charging via `resolvePrice`:

```typescript
resolvePrice: async (request) => {
  if (isOverCapacity()) {
    return {
      reject: true,
      message: 'Server is currently at capacity. Please try again later.',
    };
  }
  return { amount: 10, currencyUnit: 'sats' };
}
```

## Client Patterns

### Multiple Handlers

Support multiple payment rails:

```typescript
const paidTransport = withClientPayments(baseTransport, {
  handlers: [
    new LnBolt11NwcPaymentHandler({ nwcConnectionString: '...' }),
    new LnBolt11LnbitsPaymentHandler({ apiKey: '...', baseUrl: '...' }),
  ],
});
```

### Handling Payment Rejected

Listen for payment rejection notifications:

```typescript
client.onNotification(async (notification) => {
  if (notification.method === 'notifications/payment_rejected') {
    console.error('Payment rejected:', notification.params?.message);
    // Handle rejection (show user, abort operation, etc.)
  }
});
```

### PMI Advertisement

PMI tags are automatically added when wrapping with `withClientPayments`. The client advertises which payment methods it supports during initialization.

## Built-in Rails

The SDK currently ships multiple built-in payment rails under the same PMI:

- **PMI**: `bitcoin-lightning-bolt11`

### Lightning over NWC (NIP-47)

Server: `LnBolt11NwcPaymentProcessor`
Client: `LnBolt11NwcPaymentHandler`

```typescript
const processor = new LnBolt11NwcPaymentProcessor({
  nwcConnectionString: 'nostr+walletconnect://...',
});
```

### Lightning via LNbits (REST API)

Server: `LnBolt11LnbitsPaymentProcessor`
Client: `LnBolt11LnbitsPaymentHandler`

```typescript
const processor = new LnBolt11LnbitsPaymentProcessor({
  apiKey: '...',
  baseUrl: 'https://lnbits.example.com',
});
```

More rails may be added over time (new PMIs and/or additional implementations under existing PMIs). Prefer selecting rails based on PMI compatibility and operational needs.

## Build Your Own Rail (Custom PMI)

Implement:

- A server-side `PaymentProcessor` (issue + verify)
- A client-side `PaymentHandler` (pay)

Example custom processor:

```typescript
class MyCustomProcessor implements PaymentProcessor {
  readonly supportedPMIs = ['my-protocol-v1'];
  
  async createInvoice(amount: number, currencyUnit: string, metadata: unknown): Promise<Invoice> {
    // Create invoice via your payment system
    return { id: '...', paymentRequest: '...' };
  }
  
  async verifyPayment(invoiceId: string): Promise<boolean> {
    // Verify payment was received
    return true;
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No `payment_required` notification | Verify request matches `method` + `name` in `pricedCapabilities` |
| Payment succeeds but no `payment_accepted` | Verify server relay connectivity and processor verification settings |
| Immediate rejection | Handle `notifications/payment_rejected` and surface the optional `message` |

For general relay/encryption/connection issues, see [Troubleshooting](/cvmi/skills/troubleshooting).

## Related Resources

- [CEP-8 Specification](/spec/ceps/cep-8) — Full payment specification
- [CEP-21](/spec/ceps/informational/cep-21) — Rejection without charging
- [Payments Getting Started](/ts-sdk/payments/getting-started) — SDK payments guide
- [Payments Server](/ts-sdk/payments/server) — Server-side payments
- [Payments Client](/ts-sdk/payments/client) — Client-side payments
