---
title: ApplesauceRelayPool
description: An advanced relay handler implementation using the applesauce-relay library for the @contextvm/sdk.
---

# `ApplesauceRelayPool`

The `ApplesauceRelayPool` is an advanced implementation of the [`RelayHandler`](/reference/ts-sdk/relay/relay-handler-interface) interface that uses the `applesauce-relay` library. It provides sophisticated relay management with automatic reconnection, liveness monitoring, and robust subscription handling.

## Overview

- **Automatic Connection Management**: Per-relay reconnect backoff, so a relay coming back online is picked up quickly.
- **Liveness Monitoring**: A periodic `PING_FILTER` round-trip detects half-open sockets (e.g. after an app is backgrounded) and triggers a full rebuild with subscription replay. Also available on demand via [`probe()`](#probe-timeoutms-number-promise-boolean).
- **First-Ack Publish**: `publish()` resolves on the first accepted `OK`, so one unresponsive relay cannot set the latency floor for the pool (see [Publish acknowledgement modes](#publish-acknowledgement-modes)).
- **Advanced Subscription Management**: Subscriptions are tracked with replay intent and restored after every rebuild.

This implementation is ideal for applications that require sophisticated relay management and better resilience against network interruptions.

## `constructor(relayUrls: string[], opts?)`

The constructor takes an array of relay URLs and optional configuration:

```typescript
import { ApplesauceRelayPool } from '@contextvm/sdk';
import { NostrClientTransport } from '@contextvm/sdk';

const pool = new ApplesauceRelayPool(
  ['wss://relay1.com', 'wss://relay2.io'],
  {
    // Liveness ping cadence (default: 120_000)
    pingFrequencyMs: 30_000,
    // Per-relay probe timeout (default: 20_000)
    pingTimeoutMs: 2_500,
    // Reconnect backoff (defaults: 3_000 / 30_000)
    reconnectBaseDelayMs: 3_000,
    reconnectMaxDelayMs: 30_000,
    // Publish policy (defaults: timeout 10_000, retries 1, ackMode 'first-ack')
    publishOptions: {
      timeout: 10_000,
      retries: 1,
      ackMode: 'first-ack',
    },
    // Options passed through to each underlying applesauce-relay Relay
    relayOptions: {},
  },
);

// Pass the instance to a transport
const transport = new NostrClientTransport({
  relayHandler: pool,
  // ... other options
});
```

## How It Works

### Connection Management

- **`connect()`**: Validates relay URLs and initializes the relay group.
- **`disconnect()`**: Terminal teardown — cancels in-flight publish retries, stops the liveness monitor, and closes all relays. The pool never resurrects after this.

### Event Publishing

- **`publish(event, { abortSignal })`**: Sends the event to every relay and resolves per the configured ack mode (see below). Publishes are retried indefinitely until at least one relay accepts — MCP round-trips cannot complete otherwise. An explicit rejection (`OK: false`) from a connected relay is terminal and throws `'Relay rejected publish'`; a relay that simply never answered (half-open socket) is retried, never misclassified as a rejection.

#### Publish acknowledgement modes

- **`'first-ack'` (default)**: Every relay receives the `EVENT` frame up front, and the publish resolves as soon as the **first** relay accepts the event. Slower relays are never waited on — their deliveries still complete in the background, but their acknowledgements are discarded. One half-open relay can therefore no longer stall every RPC on the pool. This matches the semantics used by other Nostr clients (e.g. nostr-tools resolves on first `OK`).
- **`'all'`**: Waits for every relay's attempt ladder to settle before resolving (pre-0.14 semantics). Use this if you depend on settled per-relay outcomes rather than latency.

### Subscription Management

- **`subscribe(filters, onEvent, onEose)`**: Subscribes via the relay group's raw REQ stream (no relay-layer dedup; the transport layer owns deduplication). Returns an unsubscribe function; subscription intent is preserved across rebuilds.
- **`unsubscribe()`**: Closes all active subscriptions and clears tracking.

### Liveness Monitoring

The liveness monitor starts lazily on the first subscription and stops when the last one unsubscribes (an idle pool legitimately has no live sockets). Every `pingFrequencyMs` it probes each relay that reports `connected` with a dummy `REQ` (`PING_FILTER`) and expects an `EOSE` within `pingTimeoutMs`. Any timeout triggers a **rebuild**: all relays are replaced and every stored subscription is replayed. In-flight publishes ride an "ambiguous during rebuild" retry path, so a probe is safe alongside active traffic.

## `probe(timeoutMs?: number): Promise<boolean>`

Probes pool liveness on demand using the same mechanism as the periodic monitor:

- every connected relay must answer a `PING_FILTER` round-trip within `timeoutMs` (default: the configured `pingTimeoutMs`);
- any failure triggers a rebuild (subscriptions replayed) and the rebuild **completes before `false` resolves**, so the caller's next call lands on fresh sockets;
- resolves `true` when healthy — including the vacuous case of no active subscriptions — and `false` (never throws) otherwise, so callers can count failures;
- always resolves `false` after `disconnect()`;
- read-only when healthy; safe alongside in-flight calls, the periodic monitor, and concurrent probes (which share a single in-flight probe).

Typical use: fire it on app "attention events" (browser `visibilitychange`, mobile resume, native `appStateChange`) to convert a post-suspend 8–20s first-RPC failure into a `pingTimeoutMs`-bounded background heal:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // ~2.5s bounded heal with pingTimeoutMs: 2_500
    void pool.probe().then((healthy) => {
      if (!healthy) {
        // optional: surface degraded state / count failures
      }
    });
  }
});
```

## When to Use ApplesauceRelayPool

Consider using `ApplesauceRelayPool` when:

- You need robust connection management with half-open socket detection (mobile/backgrounded apps).
- Your application requires high availability and resilience across network switches and suspensions.
- You want publish latency bounded by the healthiest relay, not the slowest one.

## Next Steps

- Learn how to build a custom relay handler: **[Custom Relay Handler](/reference/ts-sdk/relay/custom-relay-handler)**
- Understand the relay handler interface: **[Relay Handler Interface](/reference/ts-sdk/relay/relay-handler-interface)**
