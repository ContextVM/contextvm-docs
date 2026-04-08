---
title: CEP-23 Server Profile Metadata and Social Communications
description: Optional kind 0 metadata and kind 1 notes for server social presence on Nostr
---

# Server Profile Metadata and Social Communications

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP defines optional social presence primitives for ContextVM servers using standard Nostr events: `kind:0` profile metadata and `kind:1` notes for social communications.

ContextVM servers MAY publish `kind:0` metadata signed by the same server keypair used for protocol operation and announcements. Servers MAY also publish regular `kind:1` notes for social announcements, public updates, changelogs, and operator communication. This enables social presence in the broader Nostr ecosystem while preserving the existing capability-announcement model.

## Motivation

CEP-6 announcements are capability catalogs. They are optimized for machine and protocol discovery, not for social identity rendering.

Nostr clients already treat `kind:0` as the canonical identity primitive and render it in user-facing profiles. Reusing this standard primitive allows server operators to present human-friendly identity metadata (name, avatar, website, etc.) without inventing a new profile format.

Not all servers want a social presence. Therefore, profile metadata publication is explicitly opt-in, and publishing `kind:1` notes for social announcements or communications is also optional.

## Specification

### NIP-01 Metadata Content

When publishing server profile metadata, implementations MUST use `kind:0`. The `content` field MUST be a string containing stringified JSON compatible with NIP-01 metadata conventions.

Common fields include:

- `name`
- `about`
- `picture`
- `banner`
- `website`
- `nip05`
- `lud16`

Example:

```json
{
  "kind": 0,
  "pubkey": "<server-pubkey>",
  "content": "{\"name\":\"Example Server\",\"about\":\"Public MCP provider\",\"picture\":\"https://example.com/avatar.png\",\"website\":\"https://example.com\"}",
  "tags": []
}
```

### Optional Social Communications

Servers MAY additionally publish `kind:1` text notes for public updates, changelogs, or operator communication.

This CEP does not define special semantics for those notes beyond existing Nostr conventions.

### Relationship to CEP-6 Announcements

`kind:11316` and `kind:0` serve different roles and are complementary:

- `kind:11316` (CEP-6): capability advertisement and protocol metadata
- `kind:0` (this CEP): identity metadata for social/client rendering

These event kinds serve different protocol purposes. `kind:11316` remains the ContextVM discoverability surface, while `kind:0` and optional `kind:1` notes support social presence and communication.

## Backward Compatibility

This CEP is additive and introduces no breaking changes:

- Servers not publishing `kind:0` continue to work unchanged
- Existing CEP-6 discovery remains valid
- Servers can adopt `kind:0` and optional `kind:1` publication incrementally

## Reference Implementation

A reference implementation of this metadata publishing can be found in the [ContextVM SDK announcement manager](https://github.com/ContextVM/sdk/blob/master/src/transport/nostr-server/announcement-manager.ts).

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
