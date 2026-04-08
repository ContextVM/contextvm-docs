---
title: CEP-24 Server Reviews
description: Standard server reviews using kind 1111 comments on kind 11316 announcements
---

# Server Reviews

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

Replies MUST reference the parent comment event with lowercase `e`, `k` (set to `1111`), and `p` tags representing the parent comment context, while keeping the uppercase `A`, `K` (set to `11316`), and `P` tags pointed to the root server announcement.

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

*Note: Dual-tagging of `A` and `a` is only applicable to top-level comments where the root and parent are the same. For replies, the parent is a comment event, so the reply MUST use an `e` tag for the parent reference and an `A` tag for the root announcement.*

### Discovery Filter

Clients discovering reviews for a specific server SHOULD query with:

```json
{
  "kinds": [1111],
  "#K": ["11316"],
  "#A": ["11316:<server-pubkey>:"]
}
```

## Backward Compatibility

This CEP is additive:

- no new ContextVM-specific review kind is introduced
- clients that already support NIP-22 comments can adopt this targeting convention incrementally
- servers without review support continue to operate unchanged

## Reference Implementation

A reference implementation for server review UI and data fetching can be found in the [ContextVM site repository](https://github.com/ContextVM/contextvm-site).

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
