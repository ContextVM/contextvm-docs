---
title: Explicit Gating API
description: TypeScript SDK reference for the CEP-8 explicit payment gating lifecycle, authorization store, canonical identity, and payment error codes
---

# Explicit Gating API

`explicit_gating` is the CEP-8 payment interaction mode where payment is surfaced **as the invocation outcome** rather than as transport middleware. When a priced capability is invoked without authorization, the server transport returns a JSON-RPC `Payment Required` error and does not forward the invocation to the underlying MCP handler until a later matching invocation consumes a paid authorization.

This is the lifecycle for clients, applications, or LLM agents that need payment gates to be **visible**. For the default notification-based flow, see [Payments (CEP-8)](/reference/ts-sdk/payments/overview) instead.

All exports below are available from `@contextvm/sdk/payments`.

## How negotiation works

The lifecycle is negotiated per session on the first direct client → server message using the `payment_interaction` Nostr tag, and the server discloses the effective mode on its first direct response.

- A client requests `explicit_gating` by sending `['payment_interaction', 'explicit_gating']` on its first direct message.
- The server **accepts** by including the same tag on its first direct response. `explicit_gating` is then the effective lifecycle for the session.
- If the server does not support or does not accept it, it returns a `-32602` negotiation error (see [Error codes](#error-codes)) or indicates `transparent` on the first response.
- If omitted by the client, `transparent` is the effective lifecycle.

`transparent` is always the compatibility baseline. See [CEP-8: Effective mode disclosure and lifecycle negotiation](/reference/ceps/cep-8#effective-mode-disclosure-and-lifecycle-negotiation) for the full rules.

## Server surface

### `withServerPayments`

```ts
import { withServerPayments } from "@contextvm/sdk/payments";

withServerPayments(transport, {
  processors: [processor],
  pricedCapabilities,
  // paymentInteraction defaults to 'optional'
});
```

When the server policy is `'optional'` (the default), `withServerPayments` registers **both** middlewares and routes each request to exactly one lifecycle based on the negotiated session mode:

- the transparent middleware (self-gates: it only handles sessions whose effective mode is `transparent`)
- an explicit-gating middleware backed by an [`AuthorizationStore`](#authorizationstore)

You do not normally construct the explicit-gating middleware yourself. Use it directly only when you are wiring middlewares onto a transport by hand.

### `PaymentInteractionPolicy` (server)

```ts
type PaymentInteractionPolicy = "optional" | "transparent";
```

Server-side configuration concern, distinct from the wire-level [`PaymentInteractionMode`](#paymentinteractionmode-client).

- `optional`: accept both lifecycles and mirror the client's requested mode for the session (the default). The server advertises `explicit_gating` support in its announcement as an **available opt-in** — it is not the effective session mode unless the client requests and the server accepts it.
- `transparent`: transparent-only. Reject `explicit_gating` requests with a `-32602` negotiation error.

Pass it through `ServerPaymentsOptions.paymentInteraction` on `withServerPayments`.

### `createExplicitGatingMiddleware`

```ts
function createExplicitGatingMiddleware(params: {
  options: ServerPaymentsOptions;
  authorizationStore: AuthorizationStore;
  sendResponse: (
    clientPubkey: string,
    response: JSONRPCErrorResponse,
    requestEventId: string,
  ) => Promise<void>;
  processorsByPmi?: Map<string, PaymentProcessor>;
}): ServerMiddlewareFn;
```

The middleware implements the explicit-gating lifecycle for each priced request:

1. Try to **claim** an existing paid authorization for the canonical invocation identity. If one exists, forward the invocation to the underlying handler and consume the authorization.
2. Otherwise, atomically mark the identity as **pending**. If already pending, return `-32043 Payment Pending`.
3. Resolve the price (honoring `reject` / `waive` results) and, if payment is required, return `-32042 Payment Required` with one `payment_option`, then start verification in the background. On success the store records a single-use grant.

The middleware self-gates: it only acts on requests whose effective session mode is `explicit_gating`, so it is safe to register alongside the transparent middleware.

### `AuthorizationStore`

A bounded, TTL-aware store that manages both the **pending** state (waiting for payment verification) and the **granted** state (paid, ready to consume) for explicit-gating authorizations.

```ts
import { AuthorizationStore } from "@contextvm/sdk/payments";

const store = new AuthorizationStore({ maxEntries: 5000 }); // maxEntries default: 5000
```

| Method                                    | Description                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `grant(identity, ttlMs)`                  | Records a single-use paid authorization. TTL is honored from the payment option's `ttl` (seconds × 1000) or the server `paymentTtlMs`.                 |
| `claim(identity): boolean`                | Atomically consumes one authorization. Returns `true` if claimed, `false` if none available or expired.                                                |
| `trySetPending(identity, ttlMs): boolean` | Atomic check-and-set. Returns `true` if this call transitioned to pending (caller emits `-32042`), `false` if already pending (caller emits `-32043`). |
| `updatePendingTtl(identity, ttlMs)`       | Updates the TTL of an existing pending entry. No-op if not pending.                                                                                    |
| `getPendingRemainingMs(identity): number` | Remaining TTL in ms for a pending entry, or `0`.                                                                                                       |
| `clearPending(identity)`                  | Clears pending state (verification failure, expiry, waive, reject).                                                                                    |

`identity` is a [`CanonicalInvocationIdentity`](#canonical-invocation-identity).

:::note[Single-process atomicity]
Atomicity relies on in-memory maps and is strictly **single-process**. For multi-process / horizontal scaling, back the grant and pending transitions with a distributed lock (for example Redis Redlock) keyed by the canonical invocation identity to prevent duplicate payments.
:::

### `ServerPaymentsOptions`

Relevant options on the server payments configuration (shared by both middlewares):

| Option               | Default      | Description                                                                                                                                                                 |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paymentInteraction` | `'optional'` | Server-side lifecycle policy ([`PaymentInteractionPolicy`](#paymentinteractionpolicy-server)).                                                                              |
| `paymentTtlMs`       | `300_000`    | Maximum time to keep a request/grant in pending-payment state. If a payment request carries a CEP-8 `ttl` (seconds), the effective verification timeout is derived from it. |
| `maxPendingPayments` | `1000`       | Max concurrent pending-payment request ids to track (DoS/memory guardrail for the transparent middleware).                                                                  |
| `resolvePrice`       | —            | Dynamic pricing callback. May return `reject` or `waive` to short-circuit.                                                                                                  |

### Transport hooks

`withServerPayments` calls these on your transport automatically. They are documented for advanced/manual wiring:

- `NostrServerTransport.setSupportedPaymentInteraction(policy: PaymentInteractionPolicy | undefined)` — exposes the configured policy to the inbound coordinator so it can accept or reject per-session `payment_interaction` requests.

## Client surface

### Default: the error reaches the caller

When `paymentInteraction` is `'explicit_gating'` and the server accepts it, a priced invocation returns a `-32042 Payment Required` JSON-RPC error to the caller — **just like any other MCP error**. No callback is required: the wrapper forwards the error unchanged, so an AI agent or application reads `error.data.instructions`, picks a `payment_option`, pays `pay_req` by its own means, and retries the same invocation.

```ts
import { withClientPayments } from "@contextvm/sdk/payments";

const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  paymentInteraction: "explicit_gating",
  // no onPaymentRequired — the -32042 error is surfaced to the caller
});
```

The error the caller receives:

```json
{
  "code": -32042,
  "message": "Payment Required",
  "data": {
    "instructions": "Pay one of the offered payment options, then retry the same request with exactly the same method and params.",
    "payment_options": [
      {
        "amount": 25,
        "pmi": "bitcoin-lightning-bolt11",
        "pay_req": "lnbc...",
        "ttl": 600
      }
    ]
  }
}
```

Typical agent loop: catch the `-32042`, read `instructions` + `payment_options`, pay `pay_req`, then retry the call with the **same `method` and `params`**. While the server is still verifying payment the retry returns `-32043 Payment Pending` (`data.retry_after`); retry again. Once the paid authorization is consumed, the normal capability result is returned.

:::tip
The `instructions` field is designed to be fed directly to an LLM agent. It tells the agent exactly what to do: pay one option, then repeat the request with the same method and params. No SDK-specific knowledge is required on the agent side.
:::

### Optional: auto-retry with `onPaymentRequired`

If you want the wrapper to intercept the `-32042` and retry automatically (for example, a non-agent UI client with a built-in wallet), provide `onPaymentRequired`. The callback pays one option and signals completion; the wrapper then re-sends the original request itself.

```ts
const paidTransport = withClientPayments(baseTransport, {
  handlers: [handler],
  paymentInteraction: "explicit_gating",
  onPaymentRequired: async ({ options }) => {
    await payInvoice(options[0].pay_req);
    return { paid: true };
  },
});
```

This is purely a convenience over the default error-as-outcome flow. When provided, the `-32042` is **not** forwarded to the caller unless the callback declines or throws.

### `ClientPaymentsOptions` (explicit-gating fields)

| Option               | Default         | Description                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paymentInteraction` | `'transparent'` | Requested payment interaction mode ([`PaymentInteractionMode`](#paymentinteractionmode-client)).                                                                                                                                                                                                                                                                                          |
| `onPaymentRequired`  | —               | **Optional** auto-retry callback. When omitted, `-32042` errors are forwarded to the caller. When provided, pay one option and return `{ paid: true }` to auto-retry, or `{ paid: false, reason? }` to surface a `-32042` to the caller. If the promise rejects, the wrapper synthesizes a `-32042` with `data: { reason, type: 'payment_handler_error' }` and never silently falls back. |
| `maxPendingRetries`  | `10`            | Max `-32043 Payment Pending` retries before giving up (applies to the `onPaymentRequired` auto-retry path). With `retry_after=2` and 1.5× exponential backoff capped at 10s, the default gives ~45s of cumulative wait.                                                                                                                                                                   |

### `onPaymentRequired` contract

```ts
onPaymentRequired?: (params: {
  options: PaymentOption[];
  instructions?: string;
  originalRequest: JSONRPCRequest;
}) => Promise<{ paid: boolean; reason?: string }>;
```

- `{ paid: true }` → the wrapper re-sends the **exact original request** (`method` + `params`) so the server matches the paid authorization.
- `{ paid: false, reason? }` → synthesizes a `-32042` to the caller. Use `reason: 'user_cancelled'` for user-initiated cancellations.
- **rejected** → synthesizes a `-32042` with `data: { reason: error.message, type: 'payment_handler_error' }`. Throw an `Error` whose `message` carries provider error details for transient failures.

If the server's verification times out or fails **after** the client paid, its pending state is cleared and the retry receives a **fresh** `-32042` with a new invoice (CEP-8-compliant). The wrapper does not deduplicate across distinct `pay_req` values.

### Effective-mode guard

A client that required `explicit_gating` **should not** auto-satisfy transparent `notifications/payment_required` messages when the server did not accept it. The wrapper enforces this: if `paymentInteraction === 'explicit_gating'` but `transport.getEffectivePaymentInteraction() !== 'explicit_gating'`, an inbound transparent payment request is declined and a local `-32000` error is synthesized instead of paying.

### `PaymentInteractionMode` (client)

```ts
type PaymentInteractionMode = "transparent" | "explicit_gating";
```

The wire/session-level mode. Set it via `ClientPaymentsOptions.paymentInteraction`.

### Transport hooks

- `NostrClientTransport.setPaymentInteraction(mode: PaymentInteractionMode)` — advertises the requested mode (auto-called by `withClientPayments`).
- `NostrClientTransport.getEffectivePaymentInteraction(): PaymentInteractionMode | undefined` — the mode disclosed by the server on its first direct response, recorded as authoritative **only when the client itself requested `explicit_gating`**. Otherwise an inbound `payment_interaction` tag is treated as a server availability advertisement.

## Canonical invocation identity

Paid authorization is matched by a **canonical invocation identity**, not by the outer request event id. This lets a retry use a different JSON-RPC `id` or a different outer Nostr event id and still match.

```ts
import {
  computeCanonicalInvocationIdentity,
  computeCanonicalInvocationHash,
  type CanonicalInvocationIdentity,
} from "@contextvm/sdk/payments";

const identity: CanonicalInvocationIdentity =
  computeCanonicalInvocationIdentity(clientPubkey, "tools/call", params);
// identity.invocationHash === hex SHA-256 of JCS({ method, params })
```

The identity is derived from:

- the requesting client's pubkey
- the SHA-256 digest of the [RFC 8785 JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785) serialization of a JSON object containing **exactly** the inner MCP request `method` and `params`

The JSON-RPC `id`, outer Nostr event id, timestamps, signatures, and event tags are **excluded**. See [CEP-8: Explicit gating authorization identity](/reference/ceps/cep-8#explicit-gating-authorization-identity).

:::warning[Params must be deterministic]
`params` MUST be deterministic across retries. No timestamps, UUIDs, or ephemeral IDs that change between calls — otherwise the retry computes a different `invocationHash` and will not match the paid authorization. Preserve the exact original `params` object when retrying.
:::

## Error codes

| Code     | Name                  | `error.data`                                                                       | When                                                                                                          |
| -------- | --------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `-32042` | Payment Required      | `PaymentRequiredErrorData` — `{ instructions?, payment_options: PaymentOption[] }` | Priced invocation with no matching paid authorization.                                                        |
| `-32043` | Payment Pending       | `PaymentPendingErrorData` — `{ instructions?, retry_after? }`                      | A matching payment is already being verified; retry the same request later.                                   |
| `-32602` | Invalid params        | `{ requested, supported }`                                                         | Server does not support the requested `payment_interaction` (negotiation, not a payment error).               |
| `-32000` | (application-defined) | —                                                                                  | `explicit_gating` only: server-side `resolvePrice` rejection, or client-side effective-mode / policy decline. |

`PaymentOption` mirrors the transparent `payment_required` fields: `{ amount, pmi, pay_req, description?, ttl?, _meta? }`.

Constants are exported for safe comparison:

```ts
import {
  PAYMENT_REQUIRED_ERROR_CODE, // -32042
  PAYMENT_PENDING_ERROR_CODE, // -32043
  UNSUPPORTED_PAYMENT_INTERACTION_ERROR_CODE, // -32602
} from "@contextvm/sdk/payments";
```

## Related

- [Payments (CEP-8) overview](/reference/ts-sdk/payments/overview)
- [CEP-8: Capability Pricing and Payment Flow](/reference/ceps/cep-8)
- [Explicit payment gating (how-to)](/how-to/payments/explicit-gating)
