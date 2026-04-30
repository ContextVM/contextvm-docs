---
title: CEP-XX Open-Ended Stream Transfer
description: Open-ended stream transfer for ContextVM using progress-notification framing
---

# Open-Ended Stream Transfer

## Abstract

This CEP defines an additive transport profile for open-ended streaming over ContextVM. It reuses MCP `notifications/progress` as the transfer envelope and uses the request `progressToken` as the stream identifier.

Unlike bounded oversized-payload transfer in [`CEP-22`](/src/content/docs/spec/ceps/cep-22.md), this CEP defines a long-lived stream model where ordered fragments may continue until the sender explicitly closes or aborts the stream. The stream payload itself is the primary output; no rendered synthetic final JSON-RPC message is required.

This CEP is intended for cases where data is naturally incremental, long-lived, or unbounded, and where representing the result as one reassembled MCP request or response would be artificial or inefficient.

## Specification

### Overview

ContextVM currently transports MCP JSON-RPC messages through Nostr events. That model fits ordinary request and response exchange well, and [`CEP-22`](/src/content/docs/spec/ceps/cep-22.md) extends it for bounded reassembly of oversized logical messages.

Some use cases are different in nature:

- long-running generation that emits useful partial output over time
- event feeds or incremental result sets
- progressive delivery where partial consumption is desirable
- cases where no single final rendered payload is the right abstraction

This CEP defines an open-ended stream-transfer profile that:

- reuses the existing single-kind ContextVM transport model
- reuses MCP `notifications/progress` as the stream envelope
- uses the request `progressToken` as the stream identifier
- supports ordered `start`, `accept`, `chunk`, `close`, and `abort` frames
- treats the stream itself as the payload rather than a bounded reassembly artifact
- allows receivers to process fragments incrementally as they arrive

This CEP is intentionally distinct from the bounded reassembly mechanism in [`CEP-22`](/src/content/docs/spec/ceps/cep-22.md). Implementations MUST NOT treat these two profiles as interchangeable.

### Capability Advertisement and Negotiation

Support for open-ended stream transfer MAY be advertised through the same additive discovery surfaces already used by ContextVM capabilities and transport features, following the patterns in [`CEP-35`](/src/content/docs/spec/ceps/informational/cep-35.md).

Peers MAY advertise support using one or more `support_open_stream` tags.

Example tags only:

```json
[["support_open_stream"]]
```

Advertisement surfaces:

- **Public announcements:** Servers MAY advertise support in public server announcements.
- **Initialization:** Clients and servers SHOULD advertise support during MCP initialization when initialization is available.
- **Stateless operation:** Clients and servers MAY advertise support in tags on the first exchanged request or response when no prior initialization occurred.

Support semantics:

- `support_open_stream` indicates support for the open-ended stream-transfer profile defined by this CEP.

### Request-Level Activation

Open-ended stream transfer for a given logical exchange is available only when the initiating request includes a valid MCP `progressToken`.

Activation rules:

- Clients that want to permit open-ended streaming for a request MUST include a `progressToken`.
- Servers MUST NOT start an open-ended stream for a request that did not include a `progressToken`.
- When no `progressToken` is present, peers MUST use ordinary non-streaming behavior or fail cleanly.

The `progressToken` is the stream identifier for the open-ended stream session.

### Sender Behavior

When open-ended stream transfer is used, the sender MUST emit an ordered sequence of MCP `notifications/progress` messages containing ContextVM stream frames.

If the sender already knows the receiver supports this CEP for the exchange, it MAY proceed directly from `start` to `chunk`. Otherwise it MUST wait for `accept` before sending `chunk` frames.

The sender:

- MAY emit any number of `chunk` frames after stream startup
- MAY keep the stream open while useful incremental output continues
- MUST terminate the stream with either `close` or `abort`
- MUST NOT silently stop transmission without a terminal frame unless transport failure prevents completion

### Progress Notification Framing

Open-ended stream frames are carried inside MCP `notifications/progress` params. The MCP envelope remains valid and additive; ContextVM defines additional frame semantics inside the params object.

Example conceptual envelope:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 1,
    "message": "(Optional) starting open stream",
    "cvm": {
      "type": "open-stream",
      "frameType": "start",
      "mode": "stream"
    }
  }
}
```

The sender MUST use `progress` values that increase monotonically across the stream, consistent with MCP progress rules.

### Frame Types

This CEP defines seven frame types:

- `start`
- `accept`
- `chunk`
- `ping`
- `pong`
- `close`
- `abort`

#### Common Fields

All open-stream-transfer frames MUST include a ContextVM-specific transport object with:

- `type`: MUST be `open-stream`
- `frameType`: one of `start`, `accept`, `chunk`, `ping`, `pong`, `close`, `abort`

The outer MCP progress params MUST include:

- `progressToken`
- `progress`

The outer MCP `total` and `message` fields MAY be used for UX hints or progress reporting, but they do not define stream correctness.

#### `start` Frame

The `start` frame begins the stream.

Required fields:

- `mode`: `stream`

Rules:

- If `mode` is omitted, receivers MAY reject the stream; senders SHOULD always provide it.
- In this CEP version, senders MUST use `mode: "stream"`.
- Receivers MUST reject unknown or unsupported stream modes.

#### `accept` Frame

The `accept` frame confirms that the receiver accepts the stream and that the sender may begin transmitting `chunk` frames.

This frame is primarily intended for bootstrap in stateless sender-to-receiver flows where support is not yet known.

Rules:

- A receiver MAY send `accept` after `start`.
- A sender that is required to wait for confirmation MUST NOT send `chunk` frames before receiving `accept`.
- `accept` SHOULD remain minimal and does not negotiate additional stream parameters in v1.

#### `chunk` Frame

The `chunk` frame carries one ordered fragment of stream payload.

Required fields:

- `data`: chunk payload

Rules:

- For open-stream-transfer frames, MCP `progress` is the normative stream-ordering field.
- Each `chunk` frame MUST use a `progress` value greater than the preceding stream frame's `progress` value.
- The payload represented by `data` is one ordered fragment of stream output.

#### `ping` Frame

The `ping` frame probes whether the peer remains responsive for the active stream.

Required fields:

- `nonce`

Rules:

- Either peer MAY send `ping` on an active stream.
- `nonce` MUST identify the probe uniquely within the stream.
- `ping` carries no stream payload.

#### `pong` Frame

The `pong` frame acknowledges a received `ping` for the active stream.

Required fields:

- `nonce`

Rules:

- A receiver of `ping` MUST respond with `pong` for the same stream unless the stream has already terminated.
- `pong.nonce` MUST match the triggering `ping.nonce`.
- `pong` acknowledges peer responsiveness only and does not acknowledge delivery or processing of stream payload.

#### `close` Frame

The `close` frame signals successful sender-side closure of the stream.

Rules:

- `close` is required for successful stream completion.
- `close` indicates that no further `chunk` frames will be sent for the stream.

#### `abort` Frame

The `abort` frame signals that the stream did not complete successfully.

Optional fields:

- `reason`

Rules:

- Either peer MAY send `abort`.
- Receivers MUST treat `abort` as terminal for the stream.
- `reason` is advisory only.

### Validation Rules

#### Ordering and Lifecycle

Receivers MUST validate stream ordering using MCP `progress`.

Rules:

- a stream MUST begin with `start`
- if confirmation is required for the stream, `accept` MUST be received before the first `chunk`
- `progress` values for open-stream-transfer frames MUST increase monotonically across the stream
- `pong` MUST correspond to an earlier `ping` on the same stream
- successful completion requires `close`
- if `close` arrives after malformed or non-monotonic ordering, the stream MUST fail

This CEP does not define replay, selective retransmission, or repair.

#### Post-Close Behavior

After `close` or `abort`:

- the stream is terminal
- receivers MUST ignore or reject later frames for the same terminated stream
- senders MUST NOT resume the same stream identifier

### Receiver Behavior

Receivers that support this CEP:

- MUST track stream state by `progressToken`
- MUST process frames in stream order
- MUST reject or fail malformed frame sequences
- MUST treat `abort` as terminal
- MUST fail a stream if `close` is received before a valid monotonic `progress` sequence has been observed

Receivers MAY expose stream fragments to applications incrementally as they arrive.

### Stateless Operation

This CEP is compatible with stateless ContextVM operation.

In stateless operation:

- peers MAY advertise support in tags on the first exchanged request or response
- stream state is correlated by `progressToken`
- receivers MUST NOT rely on a persistent connection-local session beyond temporary stream state

For stateless client-to-server streaming where the client has not previously learned server support, the client MUST send `start` first and wait for `accept` before sending `chunk` frames.

### Timeout and Keepalive Semantics

Receipt of any valid open-stream-transfer frame counts as stream activity.

Implementations MUST maintain an idle timeout for each active stream.

Rules:

- receipt of `start`, `accept`, `chunk`, `ping`, `pong`, `close`, or `abort` MUST reset the idle timeout
- if no valid frame is received before the idle timeout expires, the peer MUST send `ping`
- the receiver of `ping` MUST respond with `pong` carrying the same `nonce`
- if the probing peer does not receive a matching `pong` before its probe timeout expires, it MUST treat the stream as failed
- a peer that fails the stream due to probe timeout SHOULD send `abort` if it is still able to transmit
- implementations SHOULD enforce a hard maximum timeout or other resource policy for long-lived streams

### Example: Server-to-Client Open Stream

Client sends a request with a `progressToken`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "streaming_tool",
    "arguments": {},
    "_meta": {
      "progressToken": "req-123"
    }
  }
}
```

Server starts the stream:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 1,
    "message": "starting stream",
    "cvm": {
      "type": "open-stream",
      "frameType": "start",
      "mode": "stream"
    }
  }
}
```

Server sends stream fragments:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 2,
    "cvm": {
      "type": "open-stream-transfer",
      "frameType": "chunk",
      "data": "Hello"
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
      "type": "open-stream",
      "frameType": "chunk",
      "data": " world"
    }
  }
}
```

Server closes the stream:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-123",
    "progress": 4,
    "message": "stream complete",
    "cvm": {
      "type": "open-stream",
      "frameType": "close"
    }
  }
}
```

### Example: Stateless Client-to-Server Stream Bootstrap

Client announces intent to begin a stream:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-789",
    "progress": 1,
    "message": "starting client stream",
    "cvm": {
      "type": "open-stream",
      "frameType": "start",
      "mode": "stream"
    }
  }
}
```

Server confirms support:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "req-789",
    "progress": 2,
    "message": "client stream accepted",
    "cvm": {
      "type": "open-stream",
      "frameType": "accept"
    }
  }
}
```

After `accept`, the client sends `chunk` frames and eventually terminates the stream with `close` or `abort`.

## Backward Compatibility

This CEP introduces no breaking changes:

- peers that do not advertise support continue using ordinary ContextVM request and response transport
- peers that do not include a `progressToken` on a request do not enable open-ended stream transfer for that exchange
- peers that do not understand the ContextVM-specific open-stream framing continue to interoperate for ordinary non-streaming messages

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [CEP-19: Ephemeral Gift Wraps](/spec/ceps/cep-19)
- [CEP-22: Oversized Payload Transfer](/spec/ceps/cep-22)

## Reference Implementation

A reference implementation is intended for the ContextVM SDK transport layer.
