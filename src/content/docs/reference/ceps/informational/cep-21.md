---
title: CEP-21 Payment Method Identifier (PMI) Recommendations
description: Recommended PMIs and naming conventions for CEP-8 payments
---

# Payment Method Identifier (PMI) Recommendations

**Status:** Draft
**Author:** @contextvm-org
**Type:** Informational

## Abstract

This CEP provides **non-normative** recommendations for Payment Method Identifiers (PMIs) used with [CEP-8](/reference/ceps/cep-8).

It exists to:

- Maintain an evolving set of recommended PMIs without requiring updates to the core CEP-8 payment flow.
- Provide naming guidance so PMI payload semantics remain unambiguous across implementations.

## Scope

This CEP defines:

- A small list of recommended PMIs for the ContextVM ecosystem.
- Naming conventions for recommended PMIs.
- A convention for bearer-asset PMIs that support direct settlement (`-direct` suffix).

This CEP does **not** define:

- The syntax or semantics of CEP-8 payment notifications.
- The payload formats for any PMI (those are PMI-defined).

## Recommended PMIs (ContextVM ecosystem)

Recommended PMIs are intentionally **payload-scoped**: they are specific enough that a client can determine what a CEP-8 `pay_req` contains.

| PMI                        | `pay_req` payload (PMI-defined) | Notes                                                    |
| -------------------------- | ------------------------------- | -------------------------------------------------------- |
| `bitcoin-lightning-bolt11` | BOLT11 invoice string           | Use when `pay_req` is a BOLT11 invoice (e.g. `lnbc...`). |

**Extensibility:** Implementations MAY use any PMI that follows the W3C format. This CEP’s list is only a recommendation set.

## Naming conventions for recommended PMIs

To keep `pay_req` semantics unambiguous, recommended PMIs SHOULD:

1. Identify the asset/network/rail family (example: `bitcoin-lightning`).
2. Identify the **request payload format** (example: `bolt11`).
3. If the payload format alone is still ambiguous, include the relevant sub-variant (example: `p2tr`, `p2wpkh`).

Avoid overly generic PMIs like `bitcoin-lightning` when multiple incompatible request payload standards exist.

## Direct bearer settlement convention (`-direct` suffix)

PMIs that support direct bearer settlement (where a client can attach settlement data directly on a request via the `direct_payment` tag) SHOULD use the `-direct` suffix.

Example (conceptual): `bitcoin-cashu-v4-direct`.

This is a convention for discovery and interoperability; support is ultimately implementation-defined.

## Proposed direct bearer profile: `bitcoin-cashu-v4-direct`

**Status:** Proposed. This profile is not yet a recommended PMI. It is listed so implementations can review one concrete direct-settlement profile.

This PMI identifies a Cashu bearer payment attached to a request with `["direct_payment", "bitcoin-cashu-v4-direct", "<payload>"]`.

- **Payload:** one Cashu V4 token ([NUT-00](https://cashubtc.github.io/nuts/00/) `cashuB` serialization) from a single mint, in unit `sat`.
- **Amount:** the client pays the capability's fixed `cap` price in `sats`, known before the request. A ranged price cannot be prepaid with a single token.
- **Value:** the payment's value is what the receiver obtains after swapping the token's proofs at the mint, net of that mint's input fees ([NUT-02](https://cashubtc.github.io/nuts/02/)). Token face value can exceed this net value, so a client adds the fees the receiver will pay.
- **Mint trust:** a receiver accepts tokens only from mints it trusts. This profile does not define mint discovery; client and server agree on the mint out of band.
- **Settlement:** the receiver treats the payment as settled only after swapping the proofs into proofs it owns ([NUT-03](https://cashubtc.github.io/nuts/03/)). Decoding the token, or seeing that its proofs are spent, does not show that this receiver obtained the value.
- **Confidentiality:** the token is bearer value. Send it only on encrypted transports ([CEP-4](/reference/ceps/cep-4)), never on a cleartext request event.
- **Rejection and uncertainty:** as CEP-8 specifies for bearer assets, `notifications/payment_rejected` for this PMI means the token was definitely not redeemed. A receiver that cannot tell whether its swap happened (for example, because the mint's reply was lost) should not send `payment_rejected`. It keeps the attempt and reconciles it, for example with [NUT-09](https://cashubtc.github.io/nuts/09/) restore. A client that has not received a definite outcome should not reuse those proofs or pay another way for the same request.
- **No request format:** this PMI defines no `pay_req` format. Supporting it does not mean a server can request Cashu through `notifications/payment_required` or explicit-gating `payment_options`.

## Dependencies

- [CEP-8: Capability Pricing and Payment Flow](/reference/ceps/cep-8)
