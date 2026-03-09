---
title: SimpleRelayPool
description: A default relay handler implementation for the @contextvm/sdk.
---

⚠️ This RelayHandler is deprecated and will be removed in a future version. Please use the [ApplesauceRelayPool](/ts-sdk/relay/applesauce-relay-pool) instead.

# `SimpleRelayPool`

The `SimpleRelayPool` is the default implementation of the [`RelayHandler`](/ts-sdk/relay/relay-handler-interface) interface provided by the `@contextvm/sdk`. It uses the `SimplePool` from the `nostr-tools` library to manage connections to a list of specified relays.

## Overview

The `SimpleRelayPool` provides a straightforward way to manage relay connections for most common use cases. Its responsibilities include:

- Connecting to a predefined list of Nostr relays.
- Publishing events to all relays in the pool.
- Subscribing to events from all relays in the pool.
- Managing the lifecycle of connections and subscriptions.

It is a simple but effective solution for applications that need to interact with a static set of relays.

## `constructor(relayUrls: string[])`

The constructor takes a single argument:

- **`relayUrls`**: An array of strings, where each string is the URL of a Nostr relay (e.g., `wss://relay.damus.io`).

## Usage Example

```typescript
import { SimpleRelayPool } from "@contextvm/sdk";
import { NostrClientTransport } from "@contextvm/sdk";

// 1. Define the list of relays you want to connect to
const myRelays = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
];

// 2. Create an instance of the SimpleRelayPool
const relayPool = new SimpleRelayPool(myRelays);

// 3. Pass the instance to a transport
const transport = new NostrClientTransport({
  relayHandler: relayPool,
  // ... other options
});
```

## How It Works

The `SimpleRelayPool` wraps the `SimplePool` from `nostr-tools` and implements the methods of the `RelayHandler` interface:

- **`connect()`**: Iterates through the provided `relayUrls` and calls `pool.ensureRelay()` for each one, which establishes a connection if one doesn't already exist.
- **`disconnect()`**: Closes the connections to the specified relays.
- **`publish(event)`**: Publishes the given event to all relays in the pool by calling `pool.publish()`.
- **`subscribe(filters, onEvent)`**: Creates a subscription on all relays in the pool using `pool.subscribeMany()`. It tracks all active subscriptions so they can be closed later.
- **`unsubscribe()`**: Closes all active subscriptions that were created through the `subscribe` method.

## Limitations

The `SimpleRelayPool` is designed for simplicity. It connects to all provided relays and does not include advanced features.

For applications that require more sophisticated relay management, you may want to create a [Custom Relay Handler](/relay/custom-relay-handler).

## Next Steps

- Learn how to build a custom relay handler: **[Custom Relay Handler](/relay/custom-relay-handler)**
