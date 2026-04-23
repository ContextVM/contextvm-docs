---
title: Build your own payment rail
description: Implement custom PaymentProcessor and PaymentHandler integrations (new PMIs)
---

# Build your own payment rail

The payments layer is designed so you can add new settlement methods without changing transports.

To add a new payment rail you implement:

- a server-side `PaymentProcessor` (issue + verify)
- a client-side `PaymentHandler` (pay)

Both are keyed by a PMI string (for example `my-rail-v1`).

## 1) Choose a PMI

Pick a stable string identifier.

- Good: `acme-checkout-v1`
- Avoid: version-less strings that you can’t evolve later

## 2) Implement a processor

Processors must be able to:

- create a `pay_req` that encodes enough information for a client handler to pay
- later verify settlement for that `pay_req`

Skeleton:

```ts
import type {
  PaymentProcessor,
  PaymentProcessorCreateParams,
  PaymentProcessorVerifyParams,
} from '@contextvm/sdk/payments';

export class MyRailPaymentProcessor implements PaymentProcessor {
  public readonly pmi = 'my-rail-v1';

  public async createPaymentRequired(
    params: PaymentProcessorCreateParams,
  ): Promise<{
    amount: number;
    pay_req: string;
    description?: string;
    pmi: string;
  }> {
    // 1) Create a provider checkout/invoice
    // 2) Encode whatever the client needs to complete payment
    // 3) Return an opaque pay_req understood by the handler
    return {
      amount: params.amount,
      pay_req: JSON.stringify({
        invoiceId: '...',
        requestEventId: params.requestEventId,
      }),
      description: params.description,
      pmi: this.pmi,
    };
  }

  public async verifyPayment(
    params: PaymentProcessorVerifyParams,
  ): Promise<{ _meta?: Record<string, unknown> }> {
    // Check provider for invoice status and fail if unpaid.
    return { _meta: { verifiedAt: Date.now() } };
  }
}
```

Guidance:

- The processor runs on the server; never embed server secrets in `pay_req`.
- Make verification idempotent per `requestEventId`.

## 3) Implement a handler

Handlers must be able to pay a `pay_req` for their PMI.

Skeleton:

```ts
import type {
  PaymentHandler,
  PaymentHandlerRequest,
} from '@contextvm/sdk/payments';

export class MyRailPaymentHandler implements PaymentHandler {
  public readonly pmi = 'my-rail-v1';

  public async canHandle(_req: PaymentHandlerRequest): Promise<boolean> {
    // Optional: enforce client policy (max amount, disabled rail, etc.)
    return true;
  }

  public async handle(req: PaymentHandlerRequest): Promise<void> {
    const decoded = JSON.parse(req.pay_req) as { invoiceId: string };
    // Pay invoice using your local wallet/provider.
    await payInvoice(decoded.invoiceId);
  }
}
```

## 4) Wire into server and client

On the server:

```ts
withServerPayments(transport, {
  processors: [new MyRailPaymentProcessor()],
  pricedCapabilities,
});
```

On the client:

```ts
withClientPayments(baseTransport, {
  handlers: [new MyRailPaymentHandler()],
});
```

## 5) Test your rail

Recommended tests:

- server emits `payment_required` with your PMI
- client selects your handler
- server emits `payment_accepted` after verification
- rejection path works (`resolvePrice` → `payment_rejected`)
