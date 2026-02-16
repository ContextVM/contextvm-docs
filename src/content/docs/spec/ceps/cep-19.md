---
title: CEP-19 Ephemeral Gift Wraps
description: Optional ephemeral gift wrap convention for encrypted ContextVM communications
---

# Ephemeral Gift Wraps

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP introduces an optional convention for ContextVM servers and clients to exchange encrypted messages using an **ephemeral** gift wrap kind.

ContextVM encrypted transport currently wraps ephemeral ContextVM messages (kind `25910`) inside a NIP-59 gift wrap (kind `1059`). While the inner message is ephemeral, the outer gift wrap is not, meaning relays may persist the encrypted wrapper event.

To improve privacy for encrypted communications, this CEP defines an additional gift wrap kind `21059` (in NIP-01's ephemeral range) with the **same structure and semantics** as kind `1059`, but with the expectation that relays do not store it.

This CEP is **not a breaking change**. Implementations may continue using kind `1059`; implementations seeking maximum interoperability should support **both** kinds.

## Motivation

- **Reduced persistence on relays:** With kind `1059`, the encrypted wrapper may be stored, even if its payload is an ephemeral ContextVM message.
- **Consistent semantics:** ContextVM messages use kind `25910` specifically to indicate ephemeral transport. Using an ephemeral wrap kind aligns the wrapper with the payload.
- **Privacy-by-default option:** If encryption is used for privacy, avoiding relay persistence of the encrypted envelope can further reduce metadata and long-term collection risks.

## Specification

### Ephemeral Encryption Support Discovery

Servers that support ephemeral gift wraps MUST advertise support by including the `support_encryption_ephemeral` tag in either:

- Server initialization responses, and/or
- Public server announcements (see CEP-6).

Example (tags only):

```json
[
  ["support_encryption"],
  ["support_encryption_ephemeral"]
]
```

Support semantics:

- `support_encryption` indicates support for encrypted messages as described in CEP-4.
- `support_encryption_ephemeral` indicates support for **using kind `21059`** as a gift wrap for encrypted messages.

If a server advertises `support_encryption_ephemeral`, it is RECOMMENDED (but not required) that it also advertises `support_encryption` for clarity.

### Message Encryption Flow (Ephemeral Gift Wrap)

The encryption flow is identical to CEP-4 (NIP-44 encryption + NIP-59 gift wrap pattern with no rumor). The only difference is the gift wrap kind.

1. The inner ContextVM request/response event remains kind `25910`.
2. The encrypted payload is placed in a gift wrap event.
3. The gift wrap event kind is set to `21059`.

Gift wrap event example:

```json
{
  "id": "<gift-wrap-hash>",
  "pubkey": "<random-pubkey>",
  "created_at": "<randomized-timestamp>",
  "kind": 21059,
  "tags": [["p", "<recipient-pubkey>"]],
  "content": "<nip44-encrypted-inner-event>",
  "sig": "<random-key-signature>"
}
```

### Negotiation and Preferences

To preserve interoperability:

- If both peers support `support_encryption_ephemeral`, they SHOULD prefer kind `21059` for encrypted communications.
- If either peer does not support ephemeral gift wraps, they MUST fall back to kind `1059` (CEP-4).

### Relay Storage Expectations

Kind `21059` is in the ephemeral range (`20000 <= kind < 30000`). Relays are not expected to store ephemeral events beyond transient forwarding.

This CEP does not require any relay changes; it defines client/server behavior and expectations.

### When to Use Persistent vs Ephemeral Gift Wraps

Implementations MAY choose between kinds based on desired properties:

- **Use kind `21059`** when minimizing relay persistence is important.
- **Use kind `1059`** when persistence is a feature (e.g., delayed delivery, auditing, or history retained by relays).

## Backward Compatibility

This CEP introduces no breaking changes:

- Existing implementations using kind `1059` continue to interoperate.
- Supporting kind `21059` is additive.
- Full interoperability for encrypted transports is achieved by supporting both `1059` and `21059`.

## Reference Implementation

The ContextVM SDK encryption implementation currently uses kind `1059` (CEP-4). A reference update would:

- add support for wrapping/unwrapping kind `21059`, and
- select kind `21059` when `support_encryption_ephemeral` is advertised.

## Dependencies

- [CEP-4: Encryption Support](/spec/ceps/cep-4)
- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)

