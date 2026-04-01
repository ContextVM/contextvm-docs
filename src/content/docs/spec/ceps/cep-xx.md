---
title: CEP-XX Oversized Payload Transfer
description: Bounded oversized payload transfer for ContextVM using progress-notification framing
---

# Oversized Payload Transfer

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP defines a bounded reassembly profile for ContextVM messages that are too large to publish as a single relay event. It reuses MCP [`notifications/progress`](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress) as the framing envelope and uses the request `progressToken` as the transfer identifier.

The receiver reconstructs the exact serialized JSON-RPC message, validates a SHA-256 digest announced in `start`, and only then materializes the synthetic final request or response.

This CEP also defines an optional `accept` step for stateless client-to-server bootstrap.

## Specification

### Overview

ContextVM currently carries MCP JSON-RPC payloads inside Nostr events. This works well for ordinary request and response sizes, but large payloads may exceed relay event size limits and fail to publish even when the logical MCP operation completed correctly.

This CEP defines a bounded oversized-transfer profile that:

- reuses the existing single-kind ContextVM transport model
- reuses MCP [`notifications/progress`](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress) as the transfer envelope
- uses the request `progressToken` as the transfer identifier
- supports ordered `start`, `accept`, `chunk`, `end`, and `abort` frames
- preserves normal MCP semantics through rendered reconstruction after bounded reassembly completes

This CEP is focused on **bounded** transfer only. It does not define open-ended streams, selective retransmission, or chunk repair procedures.

### Capability Advertisement and Negotiation

Support MAY be advertised through the same additive discovery surfaces used by ContextVM features, following [`src/content/docs/spec/ceps/cep-6.md`](src/content/docs/spec/ceps/cep-6.md) and [`src/content/docs/spec/ceps/cep-19.md`](src/content/docs/spec/ceps/cep-19.md).

Peers MAY advertise support using `support_oversized_transfer` tags.

Example:

```json
[["support_oversized_transfer"]]
```

Advertisement surfaces:

- public announcements
- MCP initialization
- first exchanged request or response in stateless operation

`support_oversized_transfer` indicates support for this profile. Implementations that advertise it MUST support `completionMode: "render"`.

### Request-Level Activation

Oversized transfer is available only when the initiating request includes a valid MCP `progressToken`.

Rules:

- Clients that want to permit oversized transfer for a request MUST include a `progressToken`.
- Servers MUST NOT start an oversized transfer for a request that did not include a `progressToken`.
- When no `progressToken` is present, peers MUST use ordinary non-fragmented behavior or fail cleanly.

The `progressToken` identifies the transfer session.

### Sender Behavior

For a logical message associated with a request carrying a `progressToken`:

- the sender SHOULD proactively use oversized transfer when it can predict that direct publication is likely to exceed relay limits
- the sender MAY reactively switch to oversized transfer when direct publication fails with a size-indicative error
- the sender MUST NOT assume that an ambiguous publish failure is caused by payload size

When oversized transfer is used, the sender MUST emit an ordered sequence of MCP [`notifications/progress`](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress) messages carrying ContextVM transfer frames.

If the sender already knows the receiver supports this CEP for the exchange, it MAY proceed directly from `start` to `chunk`. Otherwise it MUST wait for `accept` before sending `chunk` frames.

### Progress Notification Framing

Oversized-transfer frames are carried inside MCP `notifications/progress` params.

Example:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 1,
    "message": "starting oversized transfer",
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "start",
      "completionMode": "render"
    }
  }
}
```

`progress` values MUST increase monotonically across the transfer.

### Frame Types

This CEP defines five frame types:

- `start`
- `accept`
- `chunk`
- `end`
- `abort`

#### Common Fields

All oversized-transfer frames MUST include a ContextVM-specific transport object with:

- `type`: MUST be `oversized-transfer`
- `frameType`: one of `start`, `accept`, `chunk`, `end`, `abort`

The outer MCP progress params MUST include:

- `progressToken`
- `progress`

The outer MCP `total` and `message` fields MAY be used for progress reporting and UX hints, but they do not define transfer correctness.

#### `start` Frame

The `start` frame begins the transfer.

Required fields:

- `completionMode`: `render`
- `digest`

Rules:

- If `completionMode` is omitted, receivers MAY reject the transfer; senders SHOULD always provide it.
- In this CEP version, senders MUST use `completionMode: "render"`.
- Receivers MUST reject unknown or unsupported completion modes.
- `digest` MUST be the SHA-256 of the exact serialized JSON-RPC message string, encoded as UTF-8.

#### `chunk` Frame

The `chunk` frame carries one ordered fragment.

Required fields:

- `data`: chunk payload

Rules:

- For oversized-transfer frames, MCP `progress` is the normative ordering field.
- Each `chunk` frame MUST use a `progress` value greater than the preceding transfer frame's `progress` value.
- The payload represented by `data` is an ordered fragment of the exact serialized logical message associated with the transfer.

#### `accept` Frame

The `accept` frame confirms that the sender may begin transmitting `chunk` frames.

Rules:

- A receiver MAY send `accept` after `start`.
- A sender that is required to wait for confirmation MUST NOT send `chunk` frames before receiving `accept`.
- `accept` does not change completion semantics.
- `accept` SHOULD remain minimal and does not negotiate additional transfer parameters in v1.

#### `end` Frame

The `end` frame signals successful sender-side completion.

Rules:

- `end` is required for successful completion.

#### `abort` Frame

The `abort` frame signals that the transfer did not complete successfully.

Optional fields:

- `reason`

Rules:

- Receivers MUST treat `abort` as terminal for the transfer.
- `reason` is advisory only.

### Completion Mode

This CEP defines one completion mode: `render`.

In `render` mode:

- the chunk sequence represents one bounded logical JSON-RPC message
- the receiver MUST buffer and reassemble chunks in `progress` order
- the receiver MUST NOT surface partial payloads upward
- the receiver MUST materialize a synthetic final request or response only after validation succeeds

The `completionMode` field remains part of the `start` frame as an extension surface for future CEPs, but this CEP defines only `render`.

### Validation Rules

#### Ordering and Completeness

Receivers MUST validate transfer ordering using MCP `progress`.

Rules:

- a transfer MUST begin with `start`
- if confirmation is required for the transfer, `accept` MUST be received before the first `chunk`
- `progress` values for oversized-transfer frames MUST increase monotonically across the transfer
- successful completion requires `end`
- if `end` arrives after malformed or non-monotonic transfer ordering, the transfer MUST fail

This CEP does not define selective retransmission or repair.

#### Digest Validation for `render`

Integrity is validated using SHA-256.

Rules:

- the sender MUST compute the digest over the exact serialized JSON-RPC message string
- the sender MUST encode that string as UTF-8 before hashing
- the `start` frame MUST carry the digest value
- the receiver MUST reconstruct the exact serialized string in `progress` order
- the receiver MUST compute SHA-256 over the reconstructed UTF-8 byte sequence
- the receiver MUST compare the result to the advertised digest before materializing the synthetic message

The digest is over the serialized message string, not an abstract JSON object.

The same digest rule applies symmetrically to:

- oversized client-to-server requests
- oversized server-to-client responses

### Receiver Behavior

Receivers that support this CEP:

- MUST track transfer state by `progressToken`
- MUST process frames in bounded transfer order
- MUST reject or fail malformed frame sequences
- MUST treat `abort` as terminal
- MUST fail a transfer if `end` is received before a valid monotonic `progress` sequence has been observed

Receivers MUST only surface the synthetic final request or response after digest validation succeeds.

### Stateless Operation

This CEP is compatible with stateless ContextVM operation:

- peers MAY advertise support in tags on the first exchanged request or response
- transfer state is correlated by `progressToken`
- receivers MUST NOT rely on a persistent connection-local session beyond temporary bounded reassembly state

For stateless oversized client-to-server transfer where the client has not previously learned server support, the client MUST send `start` first and wait for `accept` before sending `chunk` frames.

### Timeout Semantics

Because frames are carried by MCP [`notifications/progress`](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress), receipt of valid transfer frames MAY be treated as progress activity for request timeout handling.

Implementations:

- MAY reset soft request timeouts upon receiving valid transfer frames
- SHOULD still enforce a hard maximum timeout for the underlying request

### Relay Size Guidance

Practical relay acceptance thresholds are often near a total serialized event size of approximately `64 KiB`.

Implementations:

- SHOULD treat relay size limits as applying to the full serialized Nostr event, not only to the JSON-RPC payload or event `content`
- SHOULD use conservative margin below common practical thresholds when deciding whether to fragment proactively
- SHOULD prefer proactive oversized transfer when they can predict that direct publication is likely to exceed common relay acceptance limits
- MUST NOT assume that all relays enforce the same threshold or rejection behavior

### Example: `render` Response Transfer

Client request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "large_tool",
    "arguments": {},
    "_meta": {
      "progressToken": "req-123"
    }
  }
}
```

Server `start`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 1,
    "message": "starting oversized response",
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "start",
      "completionMode": "render",
      "digest": "sha256:8d969eef6ecad3c29a3a629280e686cff8fabcd1..."
    }
  }
}
```

Server `chunk` frames:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 2,
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "chunk",
      "data": "{\"jsonrpc\":\"2.0\",\"id\":1,"
    }
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 3,
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "chunk",
      "data": "\"result\":{\"content\":[...]}}"
    }
  }
}
```

Server `end`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 4,
    "message": "oversized response complete",
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "end"
    }
  }
}
```

The client reconstructs the exact serialized JSON-RPC response string, verifies the digest from `start`, and materializes a synthetic final response.

### Example: Stateless Client-to-Server Bootstrap

Client `start`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-789",
    "progress": 1,
    "message": "starting oversized request",
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "start",
      "completionMode": "render",
      "digest": "sha256:8d969eef6ecad3c29a3a629280e686cff8fabcd1..."
    }
  }
}
```

Server `accept`:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-789",
    "progress": 2,
    "message": "oversized request accepted",
    "cvm": {
      "type": "oversized-transfer",
      "frameType": "accept"
    }
  }
}
```

After `accept`, the client sends `chunk` frames and finishes with `end`.

## Backward Compatibility

This CEP introduces no breaking changes:

- peers that do not advertise support continue using ordinary ContextVM request and response transport
- peers that do not include a `progressToken` on a request do not enable oversized transfer for that exchange
- future completion modes remain possible through `completionMode`, but this CEP defines only `render`

Implementations that ignore the new tags or do not understand the oversized-transfer framing continue to interoperate for ordinary non-fragmented messages.

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)

## Reference Implementation

A reference implementation is intended for the ContextVM SDK transport layer.
