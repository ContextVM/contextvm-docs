---
title: CEP-8 Capability Pricing and Payment Flow
description: Pricing mechanism and payment processing for ContextVM capabilities
---

# Capability Pricing and Payment Flow

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes a standardized pricing mechanism and payment flow for MCP capabilities over ContextVM. The mechanism allows servers to advertise pricing for their capabilities, enables clients to discover and pay for these capabilities through various payment methods, and defines transport-level payment interaction lifecycles. This creates a sustainable ecosystem for capability servers while maintaining the decentralized nature of the protocol.

## Specification

### Overview

ContextVM pricing for capabilities is implemented through four protocol surfaces:

1. **Pricing tags**: Servers advertise reference prices using the `cap` tag.
2. **Payment Method Identifiers (PMIs)**: Peers advertise compatible settlement methods using the `pmi` tag.
3. **Payment interaction negotiation**: Peers use the default `transparent` lifecycle or negotiate `explicit_gating` for agent-visible payment gates.
4. **Payment messages**: Servers request and acknowledge payment through notifications in `transparent` mode, or JSON-RPC errors in `explicit_gating` mode.

When a capability requires payment, the server acts as the payment processor (generating and validating payment requests) while the client acts as the payment handler (executing payments for supported payment methods). Clients can discover supported payment methods beforehand through PMI discovery.

Servers MAY waive payment for a priced capability invocation based on server-side policy (for example, prepaid balances, subscriptions, allowlists, or internal accounting) and fulfill the request without emitting `notifications/payment_required`.

#### Scope and Non-goals

This CEP defines:

- How servers advertise **reference pricing** for capabilities.
- How clients and servers advertise supported payment methods.
- A default transparent notification-based flow for requesting and acknowledging payments.
- An optional explicit gating lifecycle for returning payment requirements as invocation errors.

This CEP does **not** define:

- Privacy guarantees for payment messages (use encryption mechanisms in [CEP-4](/reference/ceps/cep-4) where required).
- Rate limiting / abuse prevention mechanisms.
- Currency conversion rules or exchange rate discovery.
- Application-level payment APIs. Payment processing is a transport concern; underlying MCP handlers MAY remain unaware of CEP-8 payments.

### New Tags Introduced

This CEP introduces the following new tags to the ContextVM protocol:

#### `cap` Tag

The `cap` tag is used to convey pricing information for capabilities. It follows this format:

```json
["cap", "<capability-identifier>", "<price>", "<currency-unit>"]
```

Where:

- `<capability-identifier>` identifies the priced capability using a typed prefix:
  - `tool:<tool_name>`
  - `prompt:<prompt_name>`
  - `resource:<resource_uri>`
- `<price>` is a string representing the numerical amount:
  - Fixed price: an integer string (e.g., `"100"`).
  - Variable price: an inclusive range string `"<min>-<max>"` (e.g., `"100-1000"`).
- `<currency-unit>` is a currency unit label (e.g., `"sats"`, `"usd"`). Currency conversion, if any, is implementation-defined.

##### Notes

- The `cap` tag is a **reference** price signal for discovery and UX. The actual `amount` requested for payment is provided in [`notifications/payment_required`](#payment-required-fields) in the transparent lifecycle or in a `Payment Required` error payment option in the explicit gating lifecycle.
- If `<price>` is a range, servers MAY request any `amount` within the advertised inclusive range. Clients MAY accept or ignore the payment request based on their own policy.
- If multiple `cap` tags are present for the same capability, clients SHOULD prefer the most specific and most recent context (for example, a live `tools/list` response over a public announcement).

#### `pmi` Tag

The `pmi` tag is used to advertise supported Payment Method Identifiers. It follows this format:

```json
["pmi", "<payment-method-identifier>"]
```

Where `<payment-method-identifier>` is a standardized PMI string following the W3C Payment Method Identifiers specification (e.g., "bitcoin-lightning-bolt11", "bitcoin-cashu").

#### `direct_payment` Tag (optional)

The `direct_payment` tag is an optional optimization for bearer-asset payment methods. It allows a client to include a PMI-scoped settlement payload directly on the request event (see [Optional direct payment](#optional-direct-payment-bearer-asset-optimization)).

```json
["direct_payment", "<pmi>", "<payload>"]
```

#### `payment_interaction` Tag (optional)

The `payment_interaction` tag is an optional negotiation tag used by clients to request the payment interaction semantic for the current session.

```json
["payment_interaction", "<mode>"]
```

Where `<mode>` is one of:

- `transparent`: The default CEP-8 behavior. Payment is handled by transport/client middleware using payment notifications. After payment is verified, the server transport MAY continue fulfilling the original invocation.
- `explicit_gating`: Payment is surfaced as the response to the invocation. When payment is required, the server transport returns a JSON-RPC `Payment Required` error and does not forward the invocation to the underlying MCP handler until a later matching invocation consumes paid authorization.

##### Notes

- `payment_interaction` is a negotiation tag, not a pricing tag.
- Clients SHOULD send at most one `payment_interaction` tag on the first direct client-to-server message of a session. The tag expresses the requested effective lifecycle for the session, not a list of all lifecycles the client supports. Clients MUST NOT rely on the presence of multiple `payment_interaction` tags to express an ordered preference list.
- When present on that first direct message, it participates in the session discovery baseline described by [CEP-35: Stateless Session Discovery and Capability Learning](/reference/ceps/informational/cep-35).
- If omitted, `transparent` is the default.
- Servers MAY advertise supported interaction semantics in initialization responses or public announcements using the same tag format. Because `transparent` is the default compatibility baseline, a server that supports `explicit_gating` MAY advertise support by including a `payment_interaction=explicit_gating` tag in its public announcement, initialization response, or first direct response. Such advertisement means explicit gating is available as an opt-in mode; it does not make explicit gating the effective lifecycle unless the client requests it and the server accepts it for the session.

#### `change` Tag (optional)

The `change` tag is an optional settlement artifact for bearer-asset payment methods.

It allows a server to return overpayment remainder on the [`notifications/payment_accepted`](#payment-accepted-fields) event.

```json
["change", "<pmi>", "<payload>"]
```

Where:

- `<pmi>` identifies how to interpret `<payload>`.
- `<payload>` is an opaque string whose format is PMI-defined.

### Pricing Mechanism

Pricing information is advertised using the `cap` tag in server announcements and capability list responses:

#### Server Announcements

```json
{
  "kind": 11317,
  "content": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather information"
        // ... other tool properties
      }
    ]
  },
  "tags": [["cap", "tool:get_weather", "100", "sats"]]
}
```

#### Capability List Responses

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "result": {
      "tools": [
        {
          "name": "get_weather",
          "description": "Get current weather information"
          // ... other tool properties
        }
      ],
      "nextCursor": "next-page-cursor"
    }
  },
  "tags": [
    ["e", "<request-event-id>"],
    ["cap", "tool:get_weather", "100", "sats"]
  ]
}
```

The `cap` tag indicates that using the `get_weather` tool costs 100 satoshis, allowing clients to display pricing to users.

When `cap` tags are attached to a capability list response, they describe the pricing surface of that specific response payload. They are response-local discovery metadata for the listed capabilities, not by themselves a replacement for the peer's general session discovery baseline as defined in [CEP-35: Stateless Session Discovery and Capability Learning](/reference/ceps/informational/cep-35).

### Payment Method Identifiers (PMI)

The protocol supports multiple payment methods through Payment Method Identifiers (PMI) that follow the W3C Payment Method Identifiers specification.

#### PMI boundaries (what PMI defines)

PMIs are not only a discovery label; they define the **settlement protocol surface** for CEP-8 payments.

- The `pmi` value in `notifications/payment_required` or in an explicit gating payment option defines how a payment handler MUST interpret the associated opaque `pay_req` string.
- The format and semantics of `pay_req` are **PMI-defined**.
- The optional `_meta` objects in payment requests, payment options, and payment acknowledgments MAY contain PMI-specific fields. Unknown `_meta` fields MUST be ignored.

In other words, `pmi` is the type tag for `pay_req` (analogous to a content-type).

#### PMI Format and Registry

PMIs MUST follow the format defined by the [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/) specification, matching the pattern: `[a-z0-9-]+`.

##### Recommended PMIs

This CEP maintains no in-document registry of recommended PMIs.

Recommended PMIs and naming conventions are documented in the informational companion CEP, [CEP-21: Payment Method Identifier (PMI) Recommendations](/reference/ceps/informational/cep-21).

### PMI Discovery

PMI discovery allows clients and servers to determine payment-method compatibility before, or during, paid capability use.

#### Discovery methods

Clients discover server PMI support from public announcements, initialization responses, or request-time payment offers. Servers discover client PMI support from initialization requests or from `pmi` tags on the first direct client message in stateless operation.

#### Stateless operation

In stateless operation (no prior initialization), clients that want to use paid capabilities SHOULD include one or more `pmi` tags in the request event so the server can select a compatible payment method.

When sent on the first direct client-to-server message of a session, these `pmi` tags participate in the session discovery baseline described by [CEP-35: Stateless Session Discovery and Capability Learning](/reference/ceps/informational/cep-35). When sent on later requests, they are interpreted in the context of those requests unless another CEP explicitly defines stronger session-update semantics.

Clients that prefer `explicit_gating` SHOULD also include `payment_interaction` on that first direct request so the server can apply the session's negotiated payment interaction behavior from the start.

### Payment Interaction Negotiation

CEP-8 defines an optional session-level negotiation surface for how payment-gated invocations are exposed by the transport.

Payment interaction is a transport concern. A server transport MAY enforce payment before forwarding a priced invocation to the underlying MCP handler, and the underlying handler MAY remain unaware that payment was required.

#### Session-level semantics

This CEP defines `payment_interaction` as a session-level negotiation tag.

- When a client includes `payment_interaction` on the first direct client-to-server message of a session, that value expresses the client's requested payment interaction semantic for the session.
- After the first-message exchange, implementations SHOULD omit repeated `payment_interaction` tags unless a future CEP defines stronger update semantics.
- `transparent` is the default and remains the compatibility baseline.
- `explicit_gating` becomes the effective lifecycle for the session only when it is requested by the client and accepted by the server. If the client does not request `explicit_gating`, or if the server does not accept it, the effective lifecycle is `transparent`.
- `transparent` means payment may be handled through payment notifications without surfacing payment as the final invocation outcome.
- `explicit_gating` means payment is surfaced as a JSON-RPC error response to the invocation. The paid result is returned only if the client later sends a matching invocation after payment authorization is available.

In stateless operation, `payment_interaction` follows the first-message exchange and capability-learning rules described by [CEP-35: Stateless Session Discovery and Capability Learning](/reference/ceps/informational/cep-35). Clients that want `explicit_gating` in stateless operation SHOULD request it on the first direct invocation event of the session.

#### Effective mode disclosure and lifecycle negotiation

The effective `payment_interaction` for a session is established during the first direct message exchange. To avoid clients waiting for the wrong lifecycle, the effective mode MUST be observable on the first direct server-to-client response when the client requested a non-default mode.

- When a client includes `payment_interaction=explicit_gating` on the first direct client-to-server message of a session, the server MUST indicate the effective mode on its first direct server-to-client message in the same session. The server indicates acceptance by including a `payment_interaction=explicit_gating` tag on that first direct response.
- When a client includes `payment_interaction=explicit_gating` and the server does not support or does not accept it for the session, the server MUST NOT silently fall back to transparent payment behavior for the priced invocation. The server SHOULD either:
  - return a JSON-RPC error indicating that the requested `payment_interaction` is unsupported or unavailable for the session, or
  - indicate `payment_interaction=transparent` on the first direct response and use the transparent lifecycle for the session.
- If a client includes `payment_interaction=transparent` explicitly, or omits the tag, the effective mode is `transparent` for that session. The server MAY still echo `payment_interaction=transparent` on its first direct response; if it does not, implementations MUST continue to behave as if the effective mode is `transparent`.
- Clients SHOULD treat the observed effective `payment_interaction` on the first direct response as authoritative for the session. A client that requested `explicit_gating` and receives an effective `transparent` response, no effective-mode disclosure, or transparent `notifications/payment_required` messages SHOULD treat negotiation of `explicit_gating` as failed for that session and MAY abort the session or fall back to the observed lifecycle according to local policy.
- A client that required `explicit_gating` because payment decisions must be visible to the application or agent SHOULD NOT automatically satisfy transparent `notifications/payment_required` messages received in a session where `explicit_gating` was not accepted.

##### JSON-RPC error when `explicit_gating` is unsupported

When a server rejects a `payment_interaction=explicit_gating` request, it SHOULD return a JSON-RPC error with code `-32602 Invalid params` and a `data` object identifying the requested mode and, when useful, the modes the server supports. Example:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unsupported payment_interaction",
    "data": {
      "requested": "explicit_gating",
      "supported": ["transparent"]
    }
  }
}
```

Returning this error is sufficient to satisfy the server's effective-mode-disclosure obligation for the first direct response; it is not a payment error.

#### PMI advertisement

Servers advertise supported PMIs using the `pmi` tag in initialization responses or public announcements:

```json
{
  "pubkey": "<server-pubkey>",
  "content": {
    /* server details */
  },
  "tags": [
    ["pmi", "bitcoin-lightning-bolt11"],
    ["pmi", "another-payment-method"]
  ]
}
```

Clients advertise supported PMIs in initialization requests. Clients that prefer explicit payment gating MAY include `payment_interaction` alongside `pmi` tags on the first direct message they send:

```json
{
  "kind": 25910,
  "content": {
    "jsonrpc": "2.0",
    "id": 0,
    "method": "initialize",
    "params": {
      // Initialization parameters
    }
  },
  "tags": [
    ["p", "<server-pubkey>"],
    ["pmi", "bitcoin-lightning-bolt11"],
    ["pmi", "another-payment-method"],
    ["payment_interaction", "explicit_gating"]
  ]
}
```

### Payment Flow

The payment flow for a priced capability depends on the effective `payment_interaction` for the session:

- `transparent` uses CEP-8 payment notifications and is the default compatibility lifecycle.
- `explicit_gating` returns payment requirements as JSON-RPC errors and is intended for clients, applications, or LLM agents that need payment gates to be visible as invocation outcomes.

> Note: Pricing tags are a reference/discovery surface. Servers MAY decide at request time that an invocation does not require an interactive payment step (for example, a prepaid balance covers the price) and proceed directly to fulfill the request.

#### Capability request

The client sends a capability request to the server:

```json
{
  "kind": 25910,
  "id": "<request-event-id>",
  "pubkey": "<client-pubkey>",
  "content": {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_weather",
      "arguments": {
        "location": "New York"
      }
    }
  },
  "tags": [["p", "<provider-pubkey>"]]
}
```

#### Transparent lifecycle

In `transparent` mode, payment handling is treated as transport/client middleware behavior. The client sends an invocation, the server transport emits payment notifications when payment is required, and after payment is verified the server transport MAY continue fulfilling the original invocation.

This is the default CEP-8 behavior and remains useful for clients with automatic payment handlers, embedded wallets, prepaid policies, or user interfaces that do not want payment requirements surfaced as application-level invocation errors.

##### Payment required notification

If the capability requires payment, the server responds with a `notifications/payment_required` notification containing payment details:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_required",
    "params": {
      "amount": 100,
      "pay_req": "lnbc...",
      "description": "Payment for tool execution",
      "pmi": "bitcoin-lightning-bolt11",
      "ttl": 600,
      "_meta": {
        "note": "Optional PMI-specific metadata"
      }
    }
  },
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

##### Payment processing and completion

The client processes the payment and the server verifies it. When the client receives a payment request notification, it matches the PMI to determine if it supports the specified payment method. If compatible, the client processes the payment using the appropriate method for that PMI. The server verifies the payment according to the PMI implementation.

If the client included one or more `pmi` tags in the original request, the server SHOULD send at most one `notifications/payment_required` notification using a PMI from the intersection of client- and server-supported PMIs.

If the client did not advertise any PMIs (for example, in a purely stateless request), the server MAY send multiple `notifications/payment_required` notifications (for example, one per supported PMI). Clients MAY ignore any or all payment requests.

Once payment is verified, the server processes the capability request and responds with the normal MCP result. The server SHOULD notify the client that payment has been accepted and MAY notify the client when an attempted payment is rejected.

#### Explicit gating lifecycle

In `explicit_gating` mode, payment is treated as an invocation gate. When payment is required, the server transport returns a JSON-RPC error response to the invocation instead of emitting `notifications/payment_required`.

The server transport MUST NOT forward the payment-gated invocation to the underlying MCP handler unless a matching paid execution authorization is already available.

The `explicit_gating` lifecycle is:

1. The client requests `payment_interaction=explicit_gating` on the first direct message of the session, and the server accepts it by including `payment_interaction=explicit_gating` on its first direct response (see [Effective mode disclosure and lifecycle negotiation](#effective-mode-disclosure-and-lifecycle-negotiation)).
2. The client invokes a priced capability.
3. The server transport evaluates the request before forwarding it to the underlying MCP handler.
4. If payment is required and no matching paid execution authorization exists, the server transport returns a JSON-RPC `Payment Required` error response.
5. The error response contains one or more payment options and instructions for retrying the same invocation after payment.
6. A user, application, or agent decides whether to satisfy one payment option.
7. If payment is attempted and verification is still incomplete, repeated matching invocations SHOULD receive a JSON-RPC `Payment Pending` error response.
8. If payment succeeds, the server transport records paid execution authorization for the client and canonical invocation identity.
9. To obtain the capability result, the client SHOULD send a subsequent invocation with the same `method` and `params`.
10. When a matching authorization is available, the server transport consumes one authorization atomically, forwards the invocation to the underlying MCP handler, and returns the capability result.

##### Payment required error

When payment is required in `explicit_gating` mode, the server transport MUST return a JSON-RPC error response with code `-32042` and message `Payment Required`.

Example:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32042,
    "message": "Payment Required",
    "data": {
      "instructions": "Pay one of the offered payment options, then repeat the same request with exactly the same method and params.",
      "payment_options": [
        {
          "amount": 100,
          "pmi": "bitcoin-lightning-bolt11",
          "pay_req": "lnbc...",
          "description": "Payment for tool execution",
          "ttl": 600,
          "_meta": {
            "note": "Optional PMI-specific metadata"
          }
        }
      ]
    }
  }
}
```

`error.data.payment_options` MUST contain one or more payment option objects. Each option contains the same payment request fields defined for `notifications/payment_required`: `amount`, `pmi`, `pay_req`, optional `description`, optional `ttl`, and optional `_meta`.

`error.data.instructions` SHOULD be included and SHOULD clearly tell the client or agent to pay one option and retry the same request with the same `method` and `params`.

##### Payment pending error

If a payment attempt is known to be in progress for the same client and canonical invocation identity, but paid execution authorization is not yet available, the server transport SHOULD return a JSON-RPC error response with code `-32043` and message `Payment Pending`.

Example:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32043,
    "message": "Payment Pending",
    "data": {
      "instructions": "Payment is still being processed. Retry the same request later with exactly the same method and params.",
      "retry_after": 5
    }
  }
}
```

While payment verification remains pending, repeated matching invocations SHOULD continue to receive `Payment Pending`. If the server transport cannot establish that a payment is pending, if pending state is lost, or if payment verification fails, it MAY return a fresh `Payment Required` error.

##### Explicit gating authorization identity

In `explicit_gating` mode, successful payment verification authorizes future execution for a canonical invocation identity.

The server transport derives that identity from:

- the requesting client's pubkey
- the SHA-256 digest of the RFC 8785 JSON Canonicalization Scheme (JCS) serialization of a JSON object containing exactly the inner MCP request `method` and `params`

The JSON-RPC `id`, outer Nostr event fields, event tags, signatures, timestamps, and other transport envelope fields MUST NOT be included in the canonicalized object.

Example canonicalization input:

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "New York"
    }
  }
}
```

Each successful payment SHOULD authorize one future execution for the matching client pubkey and canonical invocation identity unless server policy explicitly grants a different number of executions. Servers MUST atomically claim or consume one matching authorization before forwarding the invocation to the underlying MCP handler, MUST prevent concurrent double-consumption, and MUST NOT forward a priced invocation to the underlying MCP handler unless a matching paid authorization has been claimed. Server policy determines whether a failed or interrupted execution restores, expires, or consumes the claimed authorization.

Servers MAY expire or evict unpaid payment options, pending payment state, and unused paid execution authorizations according to local policy. If no valid paid authorization exists when a matching invocation arrives, the server transport handles the invocation as unpaid and MAY return `Payment Required`.

#### Transparent acknowledgments and result

##### Payment accepted notification

In the transparent lifecycle, once payment is verified, the server SHOULD notify the client that payment has been accepted:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_accepted",
    "params": {
      "amount": 100,
      "pmi": "bitcoin-lightning-bolt11",
      "_meta": {
        "note": "Optional acceptance metadata"
      }
    }
  },
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

The optional `_meta` field is the extension point for payment acceptance details.

For bearer-asset direct payments, the server MAY include a [`change` tag](#change-tag-optional) on this event to return any overpayment remainder.

##### Payment rejected notification

In the transparent lifecycle, if the server cannot accept payment for a request (for example, an invalid or insufficient `direct_payment` payload), it MAY notify the client that payment was rejected:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_rejected",
    "params": {
      "pmi": "bitcoin-cashu-v4-direct",
      "message": "Insufficient direct payment"
    }
  },
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

##### Capability access

In the transparent lifecycle, the paid capability result uses the normal MCP response shape:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
      "content": [
        {
          "type": "text",
          "text": "Current weather in New York:\nTemperature: 72°F\nConditions: Partly cloudy"
        }
      ],
      "isError": false
    }
  },
  "tags": [["e", "<request-event-id>"]]
}
```

In `explicit_gating` mode, capability results are returned on subsequent invocations that consume paid execution authorization, not on the invocation that returned `Payment Required`.

### Payment Message Fields

#### Payment Required fields

In the transparent lifecycle, the `notifications/payment_required` notification `params` object contains:

- `amount` (required): Numeric payment amount
- `pay_req` (required): Payment request data string
- `description` (optional): Human-readable payment description
- `pmi` (required): Payment Method Identifier string
- `ttl` (optional): Time-to-live in seconds for this payment request. If omitted, TTL is PMI-defined and/or implementation-defined.
- `_meta` (optional): Additional payment metadata object. Use for PMI-specific or implementation-specific fields not standardized by this CEP.

##### Payment request payload

`pay_req` is an opaque string.

- It MUST be sufficient for a payment handler that supports the specified `pmi` to attempt payment.
- Its format and interpretation are PMI-defined (see [PMI boundaries](#pmi-boundaries-what-pmi-defines)).

##### TTL and metadata

- Some PMIs embed an expiry/TTL in the payment request itself (for example, a Lightning BOLT11 invoice). The optional `ttl` field provides a uniform expiry signal for clients, especially when the PMI payload does not embed one or when clients want a quick hint without parsing `pay_req`.
- `_meta` is a general-purpose container for extra fields. Implementations SHOULD ignore unknown `_meta` fields. This CEP does not standardize `_meta` contents.

#### Payment Accepted fields

In the transparent lifecycle, the `notifications/payment_accepted` notification `params` object contains:

- `amount` (required): Numeric payment amount accepted by the server
- `pmi` (required): Payment Method Identifier string
- `_meta` (optional): Additional acceptance metadata object. Use for PMI-specific or implementation-specific fields.

If the server returns change for a bearer-asset direct payment, it SHOULD include a [`change` tag](#change-tag-optional) on the event. In that case, `amount` is the final amount charged for the request.

#### Payment Rejected fields

In the transparent lifecycle, the `notifications/payment_rejected` notification `params` object contains:

- `pmi` (required): Payment Method Identifier string associated with the attempted payment.
- `amount` (optional): Numeric amount hint. For example, if a bearer-asset `direct_payment` was insufficient, servers MAY set this to the required amount.
- `message` (optional): Human-readable rejection reason.

##### Notes

- `notifications/payment_rejected` is a generic negative acknowledgment for CEP-8 payment attempts.
- For non-bearer PMIs (for example, invoice-based rails), servers will typically use [`notifications/payment_required`](#payment-required-fields) to request the exact amount, and `payment_rejected` MAY be used when an attempted payment cannot be accepted or verified.
- Only bearer-asset direct payments can return remainder value via the [`change` tag](#change-tag-optional).

### Optional direct payment (bearer-asset optimization)

Some payment methods are based on bearer assets and can be sent directly with the capability request, avoiding a `notifications/payment_required` roundtrip.

This CEP defines an optional request tag for such cases:

```json
["direct_payment", "<pmi>", "<payload>"]
```

Where:

- `<pmi>` identifies how to interpret `<payload>`.
- `<payload>` is an opaque string whose format is PMI-defined.

#### `-direct` PMI suffix

PMIs that support direct bearer payments SHOULD use the `-direct` suffix to signal that a client MAY include `direct_payment` on the request.

Example (conceptual): `bitcoin-cashu-v4-direct`.

If a server receives a request with a `direct_payment` tag:

- If the server supports the specified PMI and validates the provided payload, it MAY proceed directly to fulfill the request.
- If the provided payload is valid and its value exceeds the final price, the server MAY return the remainder as change by including a [`change` tag](#change-tag-optional) on [`notifications/payment_accepted`](#payment-accepted-fields).
- If the server cannot accept the provided payload (for example, invalid or insufficient), it MAY emit [`notifications/payment_rejected`](#payment-rejected-fields) and/or fall back to the normal CEP-8 flow (emit `notifications/payment_required`), implementation-defined.

##### Multiple `direct_payment` tags

Clients SHOULD include at most one `direct_payment` tag. If multiple `direct_payment` tags are present, servers SHOULD evaluate them in request order and select the first one whose `<pmi>` the server supports.

##### Rejection and bearer-asset consumption

For bearer-asset PMIs, servers SHOULD treat `notifications/payment_rejected` as meaning the bearer asset was not consumed/redeemed.

### Correlation, Authorization Identity, and Idempotency

Correlation and idempotency depend on the effective `payment_interaction` lifecycle for the session. The two lifecycles use different correlation identities on purpose: the transparent lifecycle correlates by the outer Nostr request event id, while the explicit gating lifecycle correlates by a canonical invocation identity derived from the inner MCP `method` and `params`.

#### Transparent lifecycle

In the transparent lifecycle, payment-related notifications MUST include an `e` tag referencing the original request event id. The "same request" for transparent idempotency means the same outer Nostr request event (same event id).

Clients MAY retry publishing the same request event, with the same event id, to achieve idempotent transparent request semantics. Servers SHOULD treat duplicate request events with the same id as retries and MUST NOT charge more than once for the same transparent request event.

#### Explicit gating lifecycle

In the explicit gating lifecycle, payment authorization and retry matching are based on the explicit-gating authorization identity, not the outer request event id. For explicit gating, "the same invocation" means the same requesting client pubkey and the same canonical invocation identity, derived from the SHA-256 digest of the RFC 8785 JSON Canonicalization Scheme (JCS) serialization of a JSON object containing exactly the inner MCP request `method` and `params`.

The JSON-RPC `id`, outer Nostr event id, timestamps, signatures, and event tags MUST NOT affect this identity. A retry MAY therefore use a different JSON-RPC `id` or a different outer event id and still match a paid authorization if `method`, `params`, and client pubkey are unchanged.

Servers MUST atomically claim or consume one matching paid authorization before forwarding the invocation to the underlying MCP handler, MUST prevent concurrent double-consumption, and MUST NOT forward a priced invocation to the underlying MCP handler unless a matching paid authorization has been claimed. Server policy determines whether a failed or interrupted execution restores, expires, or consumes the claimed authorization.

A paid authorization grants permission for execution; it does not by itself guarantee replay of the completed result. If the invocation is executed and the resulting response is not received by the client because of transport loss, relay behavior, client disconnect, or another delivery failure, this CEP does not require the server to replay the completed result. A later matching invocation for which no unused paid authorization remains MAY be treated as unpaid and MAY receive a fresh `Payment Required` error, unless server-specific policy provides another remedy.

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol:

- **Existing servers** can continue to operate without pricing
- **Existing clients** continue to work with existing servers
- **New pricing** is additive - capabilities can be free or paid
- **Optional participation**: Both providers and clients can choose to participate in pricing
- **Transparent compatibility**: If `explicit_gating` is not negotiated, implementations use the transparent notification lifecycle
- **Explicit gating is opt-in**: Clients that do not request `explicit_gating` are not required to handle `Payment Required` or `Payment Pending` invocation errors

## Reference Implementation

A reference implementation of this CEP is available in the [ContextVM TypeScript SDK](https://github.com/ContextVM/sdk) since version `0.4.0`.

## Dependencies

- [CEP-4: Encryption Support](/reference/ceps/cep-4)
- [CEP-6: Public Server Announcements](/reference/ceps/cep-6)
- [CEP-35: Stateless Session Discovery and Capability Learning](/reference/ceps/informational/cep-35)
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/)
