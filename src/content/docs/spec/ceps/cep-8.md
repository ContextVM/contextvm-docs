---
title: CEP-8 Capability Pricing and Payment Flow
description: Pricing mechanism and payment processing for ContextVM capabilities
---

# Capability Pricing and Payment Flow

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes a standardized pricing mechanism and payment flow for MCP capabilities over ContextVM. The mechanism allows servers to advertise pricing for their capabilities, enables clients to discover and pay for these capabilities through various payment methods, and defines a notification system for payment requests. This creates a sustainable ecosystem for capability servers while maintaining the decentralized nature of the protocol.

## Specification

### Overview

ContextVM pricing for capabilities is implemented through a standardized mechanism with three main components:

1. **Pricing Tags**: Servers advertise pricing information using the `cap` tag
2. **Payment Method Identifiers (PMI)**: Both parties advertise supported payment methods using the `pmi` tag
3. **Payment Notifications**: Servers notify clients of payment requirements through the `notifications/payment_required` notification, and MAY acknowledge outcomes with `notifications/payment_accepted` / `notifications/payment_rejected`
4. **Payment Interaction Negotiation**: Clients MAY advertise a preferred session-level payment interaction semantic using the `payment_interaction` tag

When a capability requires payment, the server acts as the payment processor (generating and validating payment requests) while the client acts as the payment handler (executing payments for supported payment methods). Clients can discover supported payment methods beforehand through PMI discovery, enabling informed decisions before initiating requests.

Servers MAY waive payment for a priced capability invocation based on server-side policy (for example, prepaid balances, subscriptions, allowlists, or internal accounting) and fulfill the request without emitting `notifications/payment_required`.

#### Scope and Non-goals

This CEP defines:

- How servers advertise **reference pricing** for capabilities.
- How clients and servers advertise supported payment methods.
- A minimal notification-based flow for requesting and acknowledging payments.
- An optional session-level negotiation surface for how payment-gated invocations are exposed to clients.

This CEP does **not** define:

- Privacy guarantees for payment messages (use encryption mechanisms in [CEP-4](/spec/ceps/cep-4) where required).
- Rate limiting / abuse prevention mechanisms.
- Currency conversion rules or exchange rate discovery.

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

- The `cap` tag is a **reference** price signal for discovery and UX. The actual `amount` requested for payment is provided in [`notifications/payment_required`](#payment-request-notification-fields).
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

The `payment_interaction` tag is an optional negotiation tag used by clients to advertise the preferred payment interaction semantic for the current session.

```json
["payment_interaction", "<mode>"]
```

Where `<mode>` is one of:

- `transparent`: The default CEP-8 behavior. Payment handling is treated as transport/client middleware behavior. After payment is verified, the server MAY continue fulfilling the original invocation.
- `explicit_gating`: Payment must be surfaced as a gate for the current session. After payment is verified, the server SHOULD treat the original invocation as not fulfilled and require a subsequent invocation to consume the paid authorization.

##### Notes

- `payment_interaction` is a negotiation tag, not a pricing tag.
- Clients SHOULD send at most one `payment_interaction` tag on the first direct client-to-server message of a session.
- When present on that first direct message, it participates in the session discovery baseline described by [CEP-35: Stateless Session Discovery and Capability Learning](/spec/ceps/informational/cep-35).
- If omitted, `transparent` is the default.
- Servers MAY advertise supported interaction semantics in initialization responses or public announcements using the same tag format.

#### `change` Tag (optional)

The `change` tag is an optional settlement artifact for bearer-asset payment methods.

It allows a server to return overpayment remainder on the [`notifications/payment_accepted`](#payment-accepted-notification-fields) event.

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

When `cap` tags are attached to a capability list response, they describe the pricing surface of that specific response payload. They are response-local discovery metadata for the listed capabilities, not by themselves a replacement for the peer's general session discovery baseline as defined in [CEP-35: Stateless Session Discovery and Capability Learning](/spec/ceps/informational/cep-35).

### Payment Method Identifiers (PMI)

The protocol supports multiple payment methods through Payment Method Identifiers (PMI) that follow the W3C Payment Method Identifiers specification.

#### PMI boundaries (what PMI defines)

PMIs are not only a discovery label; they define the **settlement protocol surface** for CEP-8 payments.

- The `pmi` value in `notifications/payment_required` defines how a payment handler MUST interpret the associated opaque `pay_req` string.
- The format and semantics of `pay_req` are **PMI-defined**.
- The optional `_meta` objects in `notifications/payment_required` and `notifications/payment_accepted` MAY contain PMI-specific fields. Unknown `_meta` fields MUST be ignored.

In other words, `pmi` is the type tag for `pay_req` (analogous to a content-type).

#### PMI Format and Registry

PMIs MUST follow the format defined by the [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/) specification, matching the pattern: `[a-z0-9-]+`.

##### Recommended PMIs (ContextVM ecosystem)

This CEP maintains no in-document registry of recommended PMIs.

Recommended PMIs and naming conventions are documented in the informational companion CEP, [CEP-21: Payment Method Identifier (PMI) Recommendations](/spec/ceps/informational/cep-21).

#### PMI Benefits and Roles

Using standardized PMIs provides:

1. **Interoperability**: Clear communication about supported payment methods
2. **Extensibility**: Easy addition of new payment methods
3. **Multi-currency support**: Different PMIs handle different currencies and networks
4. **Clear separation of concerns**: Servers focus on payment processing, clients on payment handling

### PMI Discovery

PMI discovery allows clients and servers to determine compatibility with payment methods, similar to encryption support discovery in [CEP-4](/spec/ceps/cep-4).

### Payment Interaction Negotiation

CEP-8 defines an optional session-level negotiation surface for how payment-gated invocations should behave from the client's perspective.

The transport primitive remains notification-based in both cases. The negotiated interaction affects how the server treats the original invocation after payment is verified.

#### Advertisement and learning

- Clients MAY advertise a preferred interaction using the `payment_interaction` tag.
- Servers MAY advertise supported interaction semantics in initialization responses, first direct responses, or public announcements.
- In stateless operation, `payment_interaction` follows the first-message exchange and capability-learning rules described by [CEP-35: Stateless Session Discovery and Capability Learning](/spec/ceps/informational/cep-35).

#### Session-level semantics

This CEP defines `payment_interaction` as a session-level negotiation tag.

- When a client includes `payment_interaction` on the first direct client-to-server message of a session, that value expresses the client's preferred payment interaction semantic for the session.
- After the first-message exchange, implementations SHOULD omit repeated `payment_interaction` tags unless a future CEP defines stronger update semantics.
- If no compatible explicit preference is negotiated, implementations MUST fall back to `transparent` behavior.
- `transparent` means payment may be handled without surfacing an unfulfilled invocation to higher-level logic.
- `explicit_gating` means payment is surfaced as an unfulfilled, payment-gated outcome and the paid result is returned only on a subsequent invocation.

Servers MAY advertise support for `explicit_gating` in discovery, initialization responses, or public announcements. Clients that want `explicit_gating` in stateless operation SHOULD request it on the first direct invocation event of the session.

#### PMI Advertisement

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

Clients advertise their supported PMIs in initialization requests:

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
    ["pmi", "another-payment-method"]
  ]
}
```

Clients that prefer explicit payment gating for the session MAY include `payment_interaction` alongside `pmi` tags on the first direct message they send:

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
    ["payment_interaction", "explicit_gating"]
  ]
}
```

#### Discovery Methods

Clients can discover PMI support through:

1. **Public Announcements**: Check `pmi` tags in server announcements
2. **Initialization Responses**: Check `pmi` tags in server initialization responses
3. **Stateless Operations**: Handle compatibility at request time when no prior discovery is possible

Servers can discover PMI support through:

1. **Client Initialization Request**: Check `pmi` tags in client initialization request
2. **First direct client message in stateless operation**: Check `pmi` and `payment_interaction` tags on the first request event of the session

##### Stateless operation

In stateless operation (no prior initialization), clients that want to use paid capabilities SHOULD include one or more `pmi` tags in the request event so the server can select a compatible payment method.

When sent on the first direct client-to-server message of a session, these `pmi` tags participate in the session discovery baseline described by [CEP-35: Stateless Session Discovery and Capability Learning](/spec/ceps/informational/cep-35). When sent on later requests, they are interpreted in the context of those requests unless another CEP explicitly defines stronger session-update semantics.

Clients that prefer `explicit_gating` SHOULD also include `payment_interaction` on that first direct request so the server can apply the session's negotiated payment interaction behavior from the start.

### Payment Flow

The complete payment flow for a capability with pricing information follows these steps:

> Note: Pricing tags are a reference/discovery surface. Servers MAY decide at request time that an invocation does not require an interactive payment step (for example, a prepaid balance covers the price) and proceed directly to fulfill the request.

#### 1. Capability Request

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

#### 2. Payment Required Notification

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

#### 3. Payment Processing

The client processes the payment and the server verifies it. When the client receives a payment request notification, it matches the PMI to determine if it supports the specified payment method. If compatible, the client processes the payment using the appropriate method for that PMI. The server verifies the payment according to the PMI implementation.

If the client included one or more `pmi` tags in the original request, the server SHOULD send at most one `notifications/payment_required` notification using a PMI from the intersection of client- and server-supported PMIs.

If the client did not advertise any PMIs (for example, in a purely stateless request), the server MAY send multiple `notifications/payment_required` notifications (for example, one per supported PMI). Clients MAY ignore any or all payment requests.

#### 3a. Interaction behavior

Server and client behavior depends on the negotiated `payment_interaction` semantic for the session.

##### `transparent` behavior

In `transparent` mode, payment handling is treated as transport/client middleware behavior.

- After payment is verified, the server MAY continue fulfilling the original invocation.
- The payment flow may remain invisible to higher-level agent logic.
- This is the default CEP-8 behavior.

##### `explicit_gating` behavior

In `explicit_gating` mode, payment is treated as an invocation gate for the session.

- When the server determines that payment is required, it MUST emit `notifications/payment_required` and MUST NOT fulfill the triggering invocation.
- The original invocation becomes payment-gated and remains unfulfilled unless the client later sends a subsequent invocation.
- Clients SHOULD surface this state to higher-level application, user, or agent logic as a structured error-like result.
- When a JSON-RPC error object is used by the client runtime, clients SHOULD use code `-32042` with message `Payment Required`.
- The surfaced error data SHOULD include the payment details from `notifications/payment_required`, including `amount`, `pmi`, `pay_req`, optional `description`, optional `ttl`, and optional `_meta`.
- If payment is later verified, the server MUST NOT treat that verification as automatic completion of the original invocation.
- Instead, the server SHOULD create redeemable paid authorization state bound to the verified payment scope.
- The server MAY emit `notifications/payment_accepted` to acknowledge that payment was accepted, but in `explicit_gating` mode that notification does not fulfill the original invocation.
- To obtain the capability result, the client MUST send a subsequent invocation.
- On that subsequent invocation, the server SHOULD check for matching paid authorization, consume it atomically if valid, and then fulfill the invocation.

This behavior is intended for clients that want payment to be surfaced explicitly to higher-level application or agent logic while preserving CEP-8's notification-based transport primitive.

##### `explicit_gating` lifecycle

The `explicit_gating` lifecycle is:

1. The client negotiates `payment_interaction=explicit_gating` on the first direct message of the session.
2. The client invokes a priced capability.
3. The server evaluates the request, determines that payment is required, and emits `notifications/payment_required` correlated to the request event.
4. The server does not send the capability result for that invocation.
5. The client maps the payment requirement into a structured surfaced failure or gated result for higher-level logic.
6. A user, application, or agent decides whether to satisfy the payment request.
7. If payment is attempted, the server verifies it according to the selected PMI.
8. If verification succeeds, the server may emit `notifications/payment_accepted` and records redeemable paid authorization state.
9. The original invocation remains unfulfilled and is not resumed automatically.
10. The client sends a subsequent invocation for the paid capability.
11. The server validates that the subsequent invocation matches the recorded authorization scope.
12. The server consumes that authorization and returns the capability result on the subsequent invocation.

##### Client surfaced error shape

In `explicit_gating` mode, clients SHOULD expose the payment gate as structured invocation failure rather than as an opaque string.

Conceptually, the surfaced object is:

```json
{
  "code": -32042,
  "message": "Payment Required",
  "data": {
    "amount": 100,
    "pmi": "bitcoin-lightning-bolt11",
    "pay_req": "lnbc...",
    "description": "Payment for tool execution",
    "ttl": 600,
    "retry_after_payment": true,
    "_meta": {
      "note": "Optional PMI-specific metadata"
    }
  }
}
```

This error shape is client-side presentation guidance for request/response runtimes. The CEP-8 wire primitive remains `notifications/payment_required`.

#### 4. Payment Accepted Notification

Once payment is verified, the server SHOULD notify the client that payment has been accepted.

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

#### 4b. Payment Rejected Notification

If the server cannot accept payment for a request (for example, an invalid or insufficient `direct_payment` payload), it MAY notify the client that payment was rejected.

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

#### 5. Capability Access

Once payment is verified, the server processes the capability request and responds with the result:

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

In `explicit_gating` mode, this capability result is typically returned on the subsequent invocation that consumes the satisfied payment authorization, not on the original invocation that triggered `notifications/payment_required`.

### Payment Request Notification Fields

The `notifications/payment_required` notification `params` object contains:

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

### Payment Accepted Notification Fields

The `notifications/payment_accepted` notification `params` object contains:

- `amount` (required): Numeric payment amount accepted by the server
- `pmi` (required): Payment Method Identifier string
- `_meta` (optional): Additional acceptance metadata object. Use for PMI-specific or implementation-specific fields.

If the server returns change for a bearer-asset direct payment, it SHOULD include a [`change` tag](#change-tag-optional) on the event. In that case, `amount` is the final amount charged for the request.

In `explicit_gating` mode, `notifications/payment_accepted` acknowledges successful payment verification and optional gate creation. It does not mean the original invocation has been fulfilled.

### Payment Rejected Notification Fields

The `notifications/payment_rejected` notification `params` object contains:

- `pmi` (required): Payment Method Identifier string associated with the attempted payment.
- `amount` (optional): Numeric amount hint. For example, if a bearer-asset `direct_payment` was insufficient, servers MAY set this to the required amount.
- `message` (optional): Human-readable rejection reason.

##### Notes

- `notifications/payment_rejected` is a generic negative acknowledgment for CEP-8 payment attempts.
- For non-bearer PMIs (for example, invoice-based rails), servers will typically use [`notifications/payment_required`](#payment-request-notification-fields) to request the exact amount, and `payment_rejected` MAY be used when an attempted payment cannot be accepted or verified.
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
- If the provided payload is valid and its value exceeds the final price, the server MAY return the remainder as change by including a [`change` tag](#change-tag-optional) on [`notifications/payment_accepted`](#payment-accepted-notification-fields).
- If the server cannot accept the provided payload (for example, invalid or insufficient), it MAY emit [`notifications/payment_rejected`](#payment-rejected-notification-fields) and/or fall back to the normal CEP-8 flow (emit `notifications/payment_required`), implementation-defined.

##### Multiple `direct_payment` tags

Clients SHOULD include at most one `direct_payment` tag. If multiple `direct_payment` tags are present, servers SHOULD evaluate them in request order and select the first one whose `<pmi>` the server supports.

##### Rejection and bearer-asset consumption

For bearer-asset PMIs, servers SHOULD treat `notifications/payment_rejected` as meaning the bearer asset was not consumed/redeemed.

### Correlation and Idempotency

Payment-related notifications MUST include an `e` tag referencing the original request event id.

Clients MAY retry publishing the same request event (same event id) to achieve idempotent semantics. Servers SHOULD treat duplicate request events with the same id as retries and MUST NOT charge more than once for the same request.

In `explicit_gating` mode, successful payment verification SHOULD create a redeemable payment authorization whose scope is defined by server policy. At minimum, servers SHOULD bind that authorization to the requesting client and the priced capability. Servers SHOULD also bind it to a quote, challenge, or equivalent server-side payment record. Servers MAY bind more narrowly, for example to a quoted amount, request shape, capability arguments, payment rail, or expiry.

Unless server policy explicitly defines otherwise, this authorization SHOULD be single-use. Servers SHOULD consume that authorization atomically when fulfilling the subsequent paid invocation, MUST prevent concurrent double-consumption, and MUST NOT use payment acceptance alone as fulfillment of the original invocation.

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol:

- **Existing servers** can continue to operate without pricing
- **Existing clients** continue to work with existing servers
- **New pricing** is additive - capabilities can be free or paid
- **Optional participation**: Both providers and clients can choose to participate in pricing

## Reference Implementation

A reference implementation of this CEP is available in the [ContextVM TypeScript SDK](https://github.com/ContextVM/sdk) since version `0.4.0`.

## Dependencies

- [CEP-4: Encryption Support](/spec/ceps/cep-4)
- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [CEP-35: Stateless Session Discovery and Capability Learning](/spec/ceps/informational/cep-35)
- [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/)
