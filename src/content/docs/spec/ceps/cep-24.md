---
title: CEP-24 Server Reviews via NIP-22
description: Standard server reviews using kind 1111 comments on kind 11316 announcements
---

# Server Reviews via NIP-22

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP standardizes server reviews by using NIP-22 comments (`kind:1111`) as review events attached to ContextVM server announcements (`kind:11316`).

By reusing NIP-22 comment semantics, reviews become interoperable across clients and relays without requiring a ContextVM-specific review event kind.

## Motivation

ContextVM needs a discovery-friendly, ecosystem-compatible way to publish and retrieve server feedback.

Using NIP-22 comments enables:

- shared review discovery across clients
- threaded discussion and replies
- compatibility with existing moderation and anti-spam patterns

The target object for reviews is the server announcement identity (`a` coordinate for `kind:11316`), optionally anchored to the current announcement event (`e`) for better UX and context.

## Specification

### Review Event Kind

Servers and clients MUST use NIP-22 comments (`kind:1111`) for review events.

### Top-Level Comment on a Server

Top-level server reviews SHOULD include both uppercase and lowercase tags as used in NIP-22 ecosystems for broad compatibility.

```json
{
  "kind": 1111,
  "content": "Great server!",
  "tags": [
    ["A", "11316:<server-pubkey>:", "<relay-hint>"],
    ["K", "11316"],
    ["P", "<server-pubkey>", "<relay-hint>"],
    ["a", "11316:<server-pubkey>:", "<relay-hint>"],
    ["e", "<current-announcement-event-id>", "<relay-hint>", "<server-pubkey>"],
    ["k", "11316"],
    ["p", "<server-pubkey>", "<relay-hint>"]
  ]
}
```

Tag intent:

- `A` / `a`: addressable target (`11316:<server-pubkey>:`)
- `K` / `k`: target kind context (`11316` for top-level server review)
- `P` / `p`: target author context (server pubkey)
- optional `e`: explicit anchor to the latest known announcement event for timeline context

### Reply to a Comment

Replies MUST reference the parent comment event and use comment-kind context (`1111`).

```json
{
  "kind": 1111,
  "content": "I agree!",
  "tags": [
    ["A", "11316:<server-pubkey>:", "<relay-hint>"],
    ["K", "11316"],
    ["P", "<server-pubkey>", "<relay-hint>"],
    ["e", "<parent-comment-event-id>", "<relay-hint>", "<parent-author-pubkey>"],
    ["k", "1111"],
    ["p", "<parent-author-pubkey>", "<relay-hint>"]
  ]
}
```

### Discovery Filter

Clients discovering reviews for a specific server SHOULD query with:

```json
{
  "kinds": [1111],
  "#K": ["11316"],
  "#a": ["11316:<server-pubkey>:"]
}
```

Clients MAY additionally query lowercase-only variants where needed for compatibility with relay/client behavior.

## Moderation Considerations

Review consumers SHOULD apply moderation controls, including:

- trust-scoring or reputation weighting
- user-level muting and blocklists
- report flows and abuse handling

Raw chronological display without moderation signals is discouraged for production UX.

## Spam Resistance

Implementations SHOULD apply anti-spam controls to review ingestion and ranking:

- validate that `a`/`A` tags correctly reference `11316:<server-pubkey>:`
- apply NIP-13 proof-of-work thresholds where appropriate
- incorporate Web-of-Trust or local trust scoring before amplification

## Backward Compatibility

This CEP is additive:

- no new ContextVM-specific review kind is introduced
- clients that already support NIP-22 comments can adopt this targeting convention incrementally
- servers without review support continue to operate unchanged

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
