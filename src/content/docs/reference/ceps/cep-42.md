---
title: CEP-42 Server Redirect
description: A request redirection mechanism where a server returns a JSON-RPC error pointing the client to a different public key and optional relay hints
---

# Server Redirect

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP defines a request redirection mechanism for ContextVM. A server can instruct a client to re-issue a request to a different address (a public key, with optional relay hints) by returning a JSON-RPC error response. This enables server-side routing policies such as distributing load across multiple endpoints and rotating addresses for privacy, without introducing any new event kind or transport primitive.

The mechanism is policy-transparent: the reason for a redirect is a server-side concern and is never represented on the wire. It follows the same "intercept a special error, extract a retry directive, re-issue the request" pattern as the payment-gating error in CEP-8, but is independent of it.

## Motivation

ContextVM servers are addressed by public key, and there is currently no way for a server to hand a client a different address mid-exchange. Two common needs are unmet:

- A well-known entry point that does not want to serve traffic directly — for capacity, geographic routing, or operational reasons — needs to point clients at a backend.
- A server that wants to keep its announced identity out of subsequent traffic needs to move the conversation onto a different, possibly unannounced, address.

Both reduce to the same primitive: the server tells the client "use this address instead." Encoding the reason on the wire is unnecessary and would couple protocol semantics to server policy, so this CEP defines only the address hand-off.

## Specification

### Overview

A redirect is a JSON-RPC error response with a ContextVM-specific error code, carried in a kind `25910` event like any other response and correlated to the request by the `e` tag. It reuses existing addressing vocabulary: the target is a public key, with optional inline relay hints following the same conventions as CEP-17.

**Note:** The examples below present the `content` as a JSON object for readability; it must be stringified before inclusion in a Nostr event.

### Redirect Error

When a server redirects a request, it MUST return a JSON-RPC error response with code `-32044` and message `Redirect`.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32044,
    "message": "Redirect",
    "data": {
      "target": "<target-pubkey>",
      "relays": ["wss://relay1.example.com", "wss://relay2.example.com"],
      "instructions": "Re-issue this request to the target address."
    }
  }
}
```

`error.data` fields:

- `target` (required): the public key of the server that should handle the request.
- `relays` (optional): inline relay hints where the target is reachable. Absent ⇒ the client discovers relays via CEP-17 (kind `10002`) for `target`.
- `instructions` (optional): human- or agent-readable guidance, mirroring the convention in CEP-8.

The error is delivered in a kind `25910` event signed by the server the client addressed, with an `e` tag referencing the original request event, exactly like a normal response.

### Server Behavior

A server emits `-32044` whenever its own policy decides to redirect. There is no capability negotiation and no branching on what the client supports: a server configured to redirect simply redirects. A server that does not redirect never emits the error.

### Client Behavior

On receiving a `-32044` error, a client that understands it:

1. Re-issues the same request (same `method` and `params`) to `target`, on `relays` if provided, otherwise on relays discovered via CEP-17.
2. Treats `target` as the recipient for subsequent traffic in the session.

A client MUST cap the length of redirect chains it follows (for example, at most 5 hops) to prevent loops or amplification. Once the cap is reached, the client MUST surface the final redirect as an error rather than follow it further.

A client that does not recognize `-32044` surfaces it as an ordinary JSON-RPC error. This is safe degradation, not silent failure.

### Session Ownership

Because a redirected request is re-issued fresh to `target`, the target establishes any session state (such as the MCP `initialize` handshake) directly with the client. Redirect therefore requires no state transfer between the original server and the target, and works uniformly at any point in an exchange.

## Security Considerations

- **Advisory by default.** A signed redirect is authentic from the server the client addressed, but it is not proof that `target` is safe or equivalent. Clients SHOULD verify `target` before trusting it as the same service: confirm identity via its kind `11316` announcement (CEP-6), and optionally confirm capability equivalence via common-schema hashes (CEP-15).
- **Loops and amplification.** The mandatory client-side hop cap bounds redirect chains. Servers SHOULD avoid emitting redirect chains that cycle back to a previous address.
- **Payments.** If a redirected request is priced under CEP-8, the client re-issues it to `target`, and `target` becomes the payment processor for it. The original server does not collect payment for work it did not perform.

### Privacy

Encryption (CEP-4) is the baseline channel-security mechanism for ContextVM. The redirect error and its `data.target` are ordinary message content: if encryption is not in use, they travel in clear text over the wire and the target address is visible to relays and observers. Servers using redirect for privacy — for example, rotating clients onto an unannounced address — SHOULD do so over an encrypted channel, so that the only traffic the announced identity ever emits is the redirect itself.

## Backward Compatibility

This CEP is additive and introduces no breaking changes:

- No new event kind is introduced; redirects are normal kind `25910` responses.
- Servers that do not redirect are unaffected.
- Clients that do not understand `-32044` surface it as a normal error and are no worse off than with any other server refusal.

## Dependencies

- [CEP-6: Public Server Announcements](/reference/ceps/cep-6) — target identity verification
- [CEP-17: Server Relay List Metadata](/reference/ceps/cep-17) — relay discovery fallback when `relays` is absent

## Reference Implementation

A reference implementation is intended for the ContextVM SDK transport layer.
