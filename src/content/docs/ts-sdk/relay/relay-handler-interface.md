---
title: RelayHandler Interface
description: An interface for managing Nostr relay connections.
---

# `RelayHandler` Interface

The `RelayHandler` interface is another crucial abstraction in the `@contextvm/sdk`. It defines the standard for managing connections to Nostr relays, which are the backbone of the Nostr network responsible for message propagation.

## Purpose and Design

The `RelayHandler`'s purpose is to abstract the complexities of relay management, including:

- Connecting and disconnecting from a set of relays.
- Subscribing to events with specific filters.
- Publishing events to the network.
- Handling relay-specific logic, such as connection retries, timeouts, and relay selection.

By depending on this interface, the SDK's transports can remain agnostic about the specific relay management strategy being used. This allows developers to plug in different relay handlers to suit their needs.

## Non-Blocking Subscription Model

A critical aspect of the `RelayHandler` interface is that the `subscribe` method must be **non-blocking**. This design choice ensures that transports can create multiple subscriptions without waiting for each one to complete, allowing for efficient concurrent event handling.

### Key Design Principles

1. **Immediate Return**: The `subscribe` method should return immediately after initiating the subscription, without awaiting the subscription's completion.

2. **Internal Subscription Management**: Relay handlers must maintain active subscriptions internally, typically using an array or similar data structure to track subscription state.

3. **Automatic Reconnection**: Subscriptions should automatically resubscribe when connections are reestablished, ensuring continuous event delivery even during network interruptions.

## Interface Definition

The `RelayHandler` interface is defined in [`core/interfaces.ts`](/core/interfaces#relayhandler) and includes several key methods:

```typescript
export interface RelayHandler {
  connect(): Promise<void>;
  disconnect(relayUrls?: string[]): Promise<void>;
  publish(event: NostrEvent): Promise<void>;
  subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
  ): Promise<void>;
  unsubscribe(): void;
}
```

- `connect()`: Establishes connections to the configured relays.
- `disconnect()`: Closes connections to all relays.
- `subscribe(filters, onEvent)`: Creates a subscription on the connected relays, listening for events that match the provided filters and passing them to the `onEvent` callback, it also accepts an optional `onEose` callback that is called when the relay reach "end of stored events".
- `unsubscribe()`: Closes all active subscriptions.
- `publish(event)`: Publishes a Nostr event to the connected relays.

## Implementations

The SDK provides a default implementation for common use cases and allows for custom implementations for advanced scenarios.

- **[SimpleRelayPool](/relay/simple-relay-pool)**: The default implementation, which manages a pool of relays and handles connection and subscription logic.
- **[Custom Relay Handler](/relay/custom-relay-handler)**: For creating custom relay handlers that integrate with specific relay management systems, such as auth relays or custom caching.

## Next Steps

- Learn about the default implementation: **[SimpleRelayPool](/relay/simple-relay-pool)**
- Learn how to create your own: **[Custom Relay Handler](/relay/custom-relay-handler)**
