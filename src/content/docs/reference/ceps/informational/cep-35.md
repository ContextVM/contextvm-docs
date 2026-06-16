---
title: CEP-35 Stateless Session Discovery and Capability Learning
description: Informational guidance for session-scoped discovery exchange, stateless behavior, and capability learning
---

# Stateless Session Discovery and Capability Learning

**Status:** Draft
**Author:** ContextVM-org
**Type:** Informational

## Abstract

This CEP documents stateless session behavior already used in ContextVM implementations and provides a single behavioral source of truth for session-scoped discovery exchange and capability learning.

It clarifies how discovery tags are exchanged during the first direct message roundtrip of a session, how clients and servers learn each other's capabilities during stateless operation, and how implementations should preserve unknown discovery tags for extensibility.

This CEP is informational. It does not introduce new tags, event kinds, or transport primitives. It standardizes interoperable behavior around existing discovery surfaces defined elsewhere in the specification.

## Motivation

ContextVM discovery behavior is currently described across multiple CEPs and implementation-specific practice. This makes it difficult to answer simple interoperability questions such as:

- when discovery tags should be sent during stateless operation
- which side is expected to send which tags
- whether discovery learning is limited to initialization or may occur on other first-session messages
- whether unknown discovery tags should be preserved or discarded

This CEP consolidates those expectations into one concise document so implementations can converge on the same stateless behavior without depending on a specific SDK.

## Scope

This CEP defines:

- stateless session discovery behavior
- first-message exchange semantics for direct session messages
- role-oriented behavior for clients and servers
- capability learning from inbound discovery tags
- preservation of unknown discovery tags for extensibility

This CEP does **not** define:

- new discovery tags
- public announcement event formats
- relay discovery policy or bootstrap relay selection
- payment settlement semantics

## Terminology

- **Session context**: the logical exchange between one client and one server for direct communication, even when the transport is stateless.
- **Discovery tags**: tags that advertise identity, transport support, pricing, payment compatibility, or other protocol-relevant features.
- **Negotiation tags**: discovery tags sent by a client to indicate supported or preferred optional features for the current session.
- **Capability learning**: the process of observing inbound discovery tags and updating local knowledge about peer capabilities.
- **Stateless operation**: operation where an implementation does not rely on a persistent initialization handshake before useful requests and responses are exchanged.

## Behavioral Model

### First-message exchange

In stateless operation, discovery is a session-scoped first-message exchange rather than a first-response-only rule.

More precisely, discovery is exchanged on the first direct message sent by each side in a session, forming the first direct message roundtrip for that session.

- A client SHOULD include its transport capability and negotiation tags on the first direct message it sends in a session.
- A server SHOULD include its discovery tags on the first direct message it sends in the same session.
- After that initial exchange, both sides SHOULD omit repeated common discovery tags unless a specific feature definition says otherwise.

This rule is role-oriented, not initialize-oriented. A server-to-client message that is not an initialize response may still carry the server's first session discovery tags, and a client-to-server message that is not an initialize request may still carry the client's first session discovery and negotiation tags.

This model allows each side to learn peer capabilities during the first message roundtrip, regardless of whether the session began with an explicit initialization flow.

The first direct message sent by each side establishes that side's session discovery baseline.

### Server behavior

Servers MAY replay relevant discovery tags on the first direct server-to-client message of a session so clients can learn server metadata and transport support without first consulting public announcements.

Server discovery tags may include:

- server identity and descriptive metadata
- transport support tags
- capability discovery tags defined by other CEPs
- custom discovery tags

When public announcements also exist, first-message replay is complementary. It does not replace announcements as the canonical public discovery surface.

### Client behavior

Clients SHOULD expose their supported optional features on the first direct client-to-server message of a session.

Client discovery and negotiation tags may include:

- transport capability tags
- preference or compatibility tags for optional features
- feature-specific tags defined by other CEPs

This enables servers to make correct decisions during stateless operation, including feature negotiation that would otherwise require prior initialization.

### Capability learning

Implementations SHOULD learn peer capabilities from inbound discovery tags whenever they are observed on direct session messages.

Learning is not restricted to a successful initialize response. If a first direct message carries valid discovery tags, implementations MAY treat those tags as the current session discovery surface for that peer.

If later messages in the same session provide additional discovery tags, implementations MAY interpret them for the context of that message.

Unless a feature-specific CEP states otherwise, discovery tags carried on later direct messages SHOULD NOT be assumed to replace or extend the peer's general learned session discovery baseline.

This means the default model is:

- first direct message exchange establishes session-level discovery baseline
- later feature-specific tags are interpreted as message-local or response-local metadata
- only feature-specific CEPs that say otherwise define later tags as updates to learned session discovery state

## Tag Handling Rules

### Known tags

Implementations SHOULD provide ergonomic access to commonly understood discovery tags defined by ContextVM CEPs.

Examples include tags related to:

- transport support
- capability pricing
- payment method compatibility
- server identity metadata

### Unknown tags

Implementations SHOULD preserve unknown discovery tags rather than discard them.

At minimum, routing tags such as `p` and `e` SHOULD be excluded from the learned discovery surface.

Implementations MAY also exclude additional tags that are clearly unrelated to discovery as a matter of local policy.

This preserves forward compatibility and allows custom protocols to build on the same stateless discovery exchange.

### Raw tag access

Implementations SHOULD expose both:

- interpreted accessors for known discovery information
- raw discovery tags for applications that need custom behavior

Providing raw access ensures that discovery remains extensible even when an implementation does not understand every tag it observes.

Negotiation tags are related but distinct. This CEP describes when such tags are first exchanged during stateless operation, but feature-specific CEPs may define whether some negotiation tags continue to appear after the initial exchange.

## Relationship to Existing CEPs

This CEP does not replace feature-specific CEPs. Instead, it defines the behavioral rules for how discovery information from those CEPs is exchanged and learned during stateless direct communication.

Relevant specifications include:

- [CEP-6: Public Server Announcements](/reference/ceps/cep-6)
- [CEP-8: Capability Pricing and Payment Flow](/reference/ceps/cep-8)
- [CEP-17: Relay List Metadata Discovery](/reference/ceps/cep-17)
- [CEP-19: Ephemeral Gift Wrap for Encrypted Transport](/reference/ceps/cep-19)
- [CEP-22: Oversized Transfer](/reference/ceps/cep-22)

These CEPs define individual discovery vocabularies or feature semantics. This CEP defines how implementations should exchange and learn that information in stateless session context.

## Implementation Guidance

Implementations may use local policy to decide how session context is tracked and when replay state is reset.

Relay bootstrapping, fallback relay races, and similar implementation details are out of scope for standardization here. They may be documented as implementation profiles, but they are not protocol requirements of this CEP.

A reference implementation exists in the TypeScript SDK.

## Backward Compatibility

This CEP is additive and documentation-oriented.

- Existing implementations remain valid.
- Implementations that already perform first-message discovery exchange are aligned with this CEP.
- Implementations that currently treat discovery as initialization-only can adopt this behavior incrementally to improve stateless interoperability.

## Security and Privacy Considerations

Discovery tags may reveal metadata about server identity, supported features, pricing, or preferences. Implementations should avoid assuming that all discovery information is authoritative outside the current session context.

Because discovery tags may be replayed on direct messages, implementations should:

- validate feature use through normal protocol behavior rather than by tags alone
- avoid trusting unknown tags without application-level policy
- consider privacy implications when exposing descriptive or capability metadata during stateless exchange

## Reference Implementation

This behavior is already established in the ContextVM TypeScript SDK, which serves as a reference implementation for this informational CEP.

## Dependencies

- [CEP-6: Public Server Announcements](/reference/ceps/cep-6)
- [CEP-8: Capability Pricing and Payment Flow](/reference/ceps/cep-8)
- [CEP-19: Ephemeral Gift Wrap for Encrypted Transport](/reference/ceps/cep-19)
- [CEP-22: Oversized Transfer](/reference/ceps/cep-22)
