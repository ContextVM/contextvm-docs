---
title: CEP-21 Payment Method Identifier (PMI) Recommendations
description: Recommended PMIs and naming conventions for CEP-8 payments
---

# Payment Method Identifier (PMI) Recommendations

**Status:** Draft
**Author:** @contextvm-org
**Type:** Informational

## Abstract

This CEP provides **non-normative** recommendations for Payment Method Identifiers (PMIs) used with [CEP-8](/spec/ceps/cep-8).

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

| PMI | `pay_req` payload (PMI-defined) | Notes |
| --- | --- | --- |
| `bitcoin-lightning-bolt11` | BOLT11 invoice string | Use when `pay_req` is a BOLT11 invoice (e.g. `lnbc...`). |

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

## Dependencies

- [CEP-8: Capability Pricing and Payment Flow](/spec/ceps/cep-8)

