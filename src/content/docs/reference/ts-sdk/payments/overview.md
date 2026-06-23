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
- Each session runs one of two **payment interaction lifecycles** (see [Lifecycles](#payment-interaction-lifecycles)):
  - `transparent` (default): correlated JSON-RPC notifications handled by transport/client middleware
    - `notifications/payment_required` (server → client)
    - `notifications/payment_accepted` (server → client)
    - `notifications/payment_rejected` (server → client, “reject without charging”)
  - `explicit_gating` (opt-in): payment surfaced as JSON-RPC invocation errors
    - `-32042 Payment Required`
    - `-32043 Payment Pending`

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

### Variable (range) pricing

Set `maxAmount` on a `PricedCapability` to advertise an inclusive price range. The SDK serializes it as a CEP-8 range `cap` tag (`"<amount>-<maxAmount>"`) for discovery; the **settle** amount is still whatever your `resolvePrice` callback returns at request time.

```ts
const pricedCapabilities: PricedCapability[] = [
  {
    method: "tools/call",
    name: "search",
    amount: 10,
    maxAmount: 1000, // advertises "10-1000 sats"
    currencyUnit: "sats",
  },
];
```

## Payment interaction lifecycles

CEP-8 defines two ways a priced invocation can be exposed to the caller. The lifecycle is **negotiated per session** on the first direct client → server message using the `payment_interaction` Nostr tag, and the server discloses the effective mode on its first direct response.

| Mode              | How payment appears                                    | Idempotency key                                                                         | Default     |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------- |
| `transparent`     | `notifications/payment_required` handled by middleware | outer Nostr request event id                                                            | yes         |
| `explicit_gating` | `-32042` / `-32043` JSON-RPC errors on the invocation  | canonical invocation identity (SHA-256 over JCS of `method` + `params` + client pubkey) | no (opt-in) |

Use `transparent` for clients with automatic wallets, prepaid policies, or UIs that do not want payment surfaced to the application. Use `explicit_gating` when payment decisions must be **visible to the application or agent** (for example, an LLM that needs to choose whether to pay).

The server-side and client-side surfaces are kept separate:

- Server policy: [`PaymentInteractionPolicy`](/reference/ts-sdk/payments/explicit-gating#paymentinteractionpolicy-server) (`'optional' | 'transparent'`)
- Client request: [`PaymentInteractionMode`](/reference/ts-sdk/payments/explicit-gating#paymentinteractionmode-client) (`'transparent' | 'explicit_gating'`)

For the full explicit-gating machinery (authorization store, canonical identity, error shapes, transport hooks), see [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating). For an end-to-end usage guide, see [Explicit payment gating](/how-to/payments/explicit-gating).

## Server: Charging for Capabilities

### Basic Setup

On the server you:

1. define which capabilities are priced
2. configure one or more processors
3. attach server payment middleware

```ts
import { withServerPayments } from "@contextvm/sdk/payments";

const paidTransport = withServerPayments(baseTransport, {
  processors: [processor],
  pricedCapabilities: [
    {
      method: "tools/call",
      name: "my-tool",
      amount: 10,
      currencyUnit: "sats",
    },
  ],
});
```

Notes:

- `pricedCapabilities` is a set of patterns (method + name) that match incoming requests.
- The wrapper gates the request: priced requests are **not forwarded** to the underlying server until payment is verified.

#### `paymentInteraction` policy (server)

`withServerPayments` accepts a server-side `paymentInteraction` policy of type [`PaymentInteractionPolicy`](/reference/ts-sdk/payments/explicit-gating#paymentinteractionpolicy-server):

- `'optional'` **(default)**: advertises `explicit_gating` support and mirrors each client's requested lifecycle. Under the hood this registers both the transparent middleware and an [explicit-gating middleware](/reference/ts-sdk/payments/explicit-gating#createexplicitgatingmiddleware) backed by an [`AuthorizationStore`](/reference/ts-sdk/payments/explicit-gating#authorizationstore); each request is routed to one lifecycle based on the negotiated session mode.
- `'transparent'`: transparent-only. A client that requests `explicit_gating` receives a `-32602` negotiation error per [CEP-8 effective-mode disclosure](/reference/ceps/cep-8#effective-mode-disclosure-and-lifecycle-negotiation).

:::caution[Behavioral change in 0.13.0]
The default changed to `'optional'`, so a server that accepts payments now also accepts `explicit_gating` requests. Pass `paymentInteraction: 'transparent'` to restore transparent-only behavior. See [Server payments](/how-to/payments/server).
:::

### Dynamic pricing, rejection, and waiver (`resolvePrice`)

`resolvePrice` runs on every priced request and returns one of three results:

| Result                            | Meaning                                                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ amount, description?, meta? }` | **Quote** — proceed with the payment flow. `meta` is attached to the emitted payment request's `_meta`.                                              |
| `{ reject: true, message? }`      | **Policy rejection** — no invoice is created; the server emits `notifications/payment_rejected` (transparent) or a `-32000` error (explicit gating). |
| `{ waive: true }`                 | **Waiver** — the request is forwarded immediately, no payment flow.                                                                                  |

```ts
import type { ResolvePriceFn } from "@contextvm/sdk/payments";

const resolvePrice: ResolvePriceFn = async ({ capability, clientPubkey }) => {
  if (await isUserBlocked(clientPubkey))
    return { reject: true, message: "Access denied" };
  if (await hasPrepaidBalance(clientPubkey)) return { waive: true };
  return { amount: capability.amount };
};
```

The amount returned must be in the unit your chosen processor expects (for Lightning BOLT11, sats/msats). Prefer the `quotePrice`, `rejectPrice`, and `waivePrice` helper factories over raw object literals — the `reject: true` / `waive: true` discriminants are easy to mistype. For full pricing patterns (tier discounts, request-size pricing, quotas), see [Server payments](/how-to/payments/server).

### What the server emits (transparent flow)

Paid request (`transparent` lifecycle):

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

In the `explicit_gating` lifecycle the server never emits payment notifications. Instead the invocation itself returns a `-32042 Payment Required` error with `payment_options`, and the capability result is only produced on a later retry that consumes a paid authorization. See [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating).

## Client: Paying for Capabilities

### Basic Setup

On the client you:

1. configure one or more handlers
2. attach client payment middleware

```ts
import { withClientPayments } from "@contextvm/sdk/payments";

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
});
```

When the server responds with `notifications/payment_required`, the payments layer:

1. chooses a handler by PMI
2. calls the handler to pay `pay_req`
3. continues the request flow once the server confirms via `notifications/payment_accepted`

### Explicit gating

For the `explicit_gating` lifecycle, payment is surfaced as `-32042` / `-32043` invocation errors instead of notifications. Set `paymentInteraction: 'explicit_gating'` — **no callback is required**. A priced invocation returns a `-32042 Payment Required` error (with `instructions` + `payment_options`) directly to the caller, so an AI agent reads the error, pays `pay_req`, and retries the same call.

```ts
import { withClientPayments } from "@contextvm/sdk/payments";

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  paymentInteraction: "explicit_gating",
});
```

See [Explicit payment gating](/how-to/payments/explicit-gating) for the end-to-end flow and [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating) for the full reference.

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

## Types and error codes

All exports below are available from `@contextvm/sdk/payments`.

### Modes and policy

- `PaymentInteractionMode`: `'transparent' | 'explicit_gating'` — the wire/session-level mode negotiated via the `payment_interaction` tag.
- `PaymentInteractionPolicy`: `'optional' | 'transparent'` — server-side policy for which lifecycles the server accepts.
- `PaymentInteractionTag`: the `['payment_interaction', PaymentInteractionMode]` Nostr tag.

### Explicit-gating error data

- `PaymentOption`: `{ amount, pmi, pay_req, description?, ttl?, _meta? }` — a single entry inside a `-32042` error's `payment_options`.
- `PaymentRequiredErrorData`: `{ instructions?, payment_options: PaymentOption[] }` — shape of `-32042` error `data`.
- `PaymentPendingErrorData`: `{ instructions?, retry_after? }` — shape of `-32043` error `data`.
- `CanonicalInvocationIdentity`: `{ clientPubkey, invocationHash }` where `invocationHash` is hex SHA-256 over JCS of `{ method, params }`.

### Error codes

| Code     | Name             | Surface          | When                                                                                                         |
| -------- | ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `-32042` | Payment Required | invocation error | `explicit_gating`: priced invocation without authorization                                                   |
| `-32043` | Payment Pending  | invocation error | `explicit_gating`: a matching payment is still being verified                                                |
| `-32602` | Invalid params   | invocation error | `explicit_gating`: server does not support the requested interaction mode (data: `{ requested, supported }`) |

See [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating) for the authorization store, canonical identity helpers, and transport hooks that implement these codes.

## Operational guidance (production)

- Treat `resolvePrice` as part of your authorization layer: deterministic, fast, and side-effect aware.
- If you enforce quotas/one-time use, use a durable store (not an in-memory map) if you run multiple server instances.
- Keep settlement verification bounded: processors should have timeouts and should not poll indefinitely.

## Related

- [CEP-8 Specification](/reference/ceps/cep-8)
- [CEP-21: PMI Recommendations](/reference/ceps/informational/cep-21)
- [Explicit Gating API](/reference/ts-sdk/payments/explicit-gating)

## Next steps

- [Getting started](/how-to/payments/getting-started)
- [Server payments](/how-to/payments/server)
- [Client payments](/how-to/payments/client)
- [Explicit payment gating](/how-to/payments/explicit-gating)
- [Lightning over NWC](/how-to/payments/rails/lightning-nwc)
- [Build your own payment rail](/how-to/payments/custom-rails)
