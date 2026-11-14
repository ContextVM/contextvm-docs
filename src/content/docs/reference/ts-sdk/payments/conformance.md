---
title: CEP-8 Conformance
description: How the TypeScript SDK classifies CEP-8 requirements, recommendations, optional profiles, SDK reliability policies, and payment-adapter contracts
---

# CEP-8 Conformance

This page explains how the TypeScript SDK interprets [CEP-8](/reference/ceps/cep-8). It separates what the protocol requires of every implementation from what the SDK chooses to guarantee on top of it.

## Requirement classes

| Class                  | Meaning                                                              | Example                                                                                       |
| ---------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Protocol requirement   | An applicable CEP-8 MUST or MUST NOT, or a wire format CEP-8 defines | A server claims one explicit-gating authorization atomically before forwarding the invocation |
| Recommendation         | A CEP-8 SHOULD that the SDK implements                               | `-32043 Payment Pending` while verification is in progress                                    |
| Optional profile       | Required only when an implementation advertises the feature          | `direct_payment` bearer payments and the `change` tag                                         |
| SDK reliability policy | A guarantee stronger than CEP-8 requires                             | A paid result lost in delivery is republished from the retained record, without a new payment |
| Provider contract      | Behavior required of a concrete payment adapter                      | BOLT11 wallet handlers refuse invoices whose encoded amount differs from the offer            |

Only protocol requirements bind every CEP-8 implementation. An implementation can conform to CEP-8 without the SDK's reliability policies, and it is not required to support any optional profile.

## Interpretation notes

**Identity.** Explicit-gating authorizations are matched on the client pubkey and the canonical hash of `method` plus semantic `params`: the request `params` without the top-level `params._meta` member. A claimed authorization forwards the retry's original `params`, including its `_meta`.

**Payment Pending is a recommendation.** Clients must still handle a fresh `-32042` for the same invocation, because CEP-8 lets a server that has lost pending state ask for payment again.

**Payment method identifiers.** The SDK's built-in PMI, `bitcoin-lightning-bolt11`, follows the CEP-8 pattern `[a-z0-9-]+`. On ingress the SDK compares PMIs exactly, as opaque strings, and does not reject other forms. Applications are responsible for any PMI they configure.

**Units.** Amounts use the priced capability's unit, and the SDK never converts units. For `bitcoin-lightning-bolt11` the unit is sats. The built-in BOLT11 handlers refuse invoices whose encoded amount, network (when configured), or expiry does not match the offer, before any wallet request.

**Duplicate transparent requests.** CEP-8 forbids charging twice for the same request event. The SDK keeps replay records for the configured replay window and refuses events older than that window before admission.

**Result delivery.** CEP-8 does not require a server to replay a completed result. As a reliability policy, the SDK retains paid results and republishes them when the same paid request is seen again. This guarantee depends on the payment store: the default in-memory store lasts only as long as the process.

**Reconnects.** Replays of paid requests reach payment admission and are answered from the retained record, so they are not charged or executed again. Duplicate suppression for requests that are not paid is best effort and bounded by the transport's deduplication cache.

## Optional profiles

The SDK does not advertise a direct-payment PMI. `direct_payment` and `change` therefore do not apply to it.

### Proposed: Cashu direct payments

**Status:** Proposed. Not available in a released SDK version.

A proposed SDK profile implements the [`bitcoin-cashu-v4-direct`](/reference/ceps/informational/cep-21#proposed-direct-bearer-profile-bitcoin-cashu-v4-direct) PMI with these restrictions:

- One trusted mint, configured by the application, per receiver.
- Unit `sat`, mapped one-to-one to the SDK's `sats` capability unit.
- Fixed-price capabilities only. The client pays the exact net price plus the receiver's input fees, and receives no change.
- Persistent or ephemeral encryption only. A cleartext transport is refused before the client prepares a token.
- Transparent lifecycle only. Explicit gating does not accept direct payments.
- The server reserves admission before redeeming the token, swaps it into proofs it owns, and only then authorizes and dispatches the invocation once.
- `payment_rejected` is sent only when the token was definitely not redeemed. An uncertain swap is kept for reconciliation and never triggers an automatic BOLT11 fallback or a second payment.
- Wallet proofs and recovery material stay in application-owned wallet storage.
