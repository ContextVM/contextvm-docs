---
title: CEP-23 Server Profile Metadata
description: Optional kind 0 profile metadata for server social identity on Nostr
---

# Server Profile Metadata

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP defines an optional server profile mechanism using NIP-01 metadata events (`kind:0`).

ContextVM servers MAY publish `kind:0` metadata signed by the same server keypair used for protocol operation and announcements. This allows a server to establish a recognizable social identity in the broader Nostr ecosystem while preserving the existing capability-announcement model.

## Motivation

`kind:11316` announcements (CEP-6) are capability catalogs. They are optimized for machine and protocol discovery, not for social identity rendering.

Nostr clients already treat `kind:0` as the canonical identity primitive and render it in user-facing profiles. Reusing this standard primitive allows server operators to present human-friendly identity metadata (name, avatar, website, etc.) without inventing a new profile format.

Not all servers want a social presence. Therefore, profile publication is explicitly opt-in.

## Specification

### NIP-01 Metadata Content

When publishing server profile metadata, implementations MUST use `kind:0` and a JSON `content` payload compatible with NIP-01 metadata conventions.

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

### Optional ContextVM Marker

Servers MAY include a `contextvm` field in the metadata JSON content (for example, `"contextvm": true`) as an ecosystem hint.

This field is optional and non-normative. Clients MUST NOT require it for identifying a ContextVM server.

### Optional Public Notes

Servers MAY additionally publish `kind:1` text notes for public updates, changelogs, or operator communication.

This CEP does not define special semantics for those notes beyond existing Nostr conventions.

### Relationship to CEP-6 Announcements

`kind:11316` and `kind:0` serve different roles and are complementary:

- `kind:11316` (CEP-6): capability advertisement and protocol metadata
- `kind:0` (this CEP): identity metadata for social/client rendering

Servers SHOULD publish both using the same pubkey when both are enabled.

Clients that discover a server through `kind:11316` SHOULD also fetch `kind:0` for richer profile presentation.

### Publishing Behavior

Profile publication is opt-in.

When configured, servers SHOULD publish their `kind:0` profile metadata at startup and MAY republish on profile changes according to replaceable-event behavior.

## Client Rendering

When both profile sources are available:

- Clients SHOULD prefer `kind:0` metadata for profile presentation
- Clients SHOULD use `kind:11316` tags as fallback when `kind:0` is absent

This preference order allows clients to display richer identity information while maintaining compatibility with announcement-only servers.

## Backward Compatibility

This CEP is additive and introduces no breaking changes:

- Servers not publishing `kind:0` continue to work unchanged
- Existing CEP-6 discovery remains valid
- Clients can progressively enhance rendering when `kind:0` is present

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
