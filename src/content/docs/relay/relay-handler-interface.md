---
title: RelayHandler Interface
description: An interface for managing Nostr relay connections.
---

# `RelayHandler` Interface

The `RelayHandler` interface is another crucial abstraction in the `@contextvm/sdk`. It defines the standard for managing connections to Nostr relays, which are the backbone of the Nostr network responsible for message propagation.

## Purpose and Design

The `RelayHandler`'s purpose is to abstract the complexities of relay management, including:

-   Connecting and disconnecting from a set of relays.
-   Subscribing to events with specific filters.
-   Publishing events to the network.
-   Handling relay-specific logic, such as connection retries, timeouts, and relay selection.

By depending on this interface, the SDK's transports can remain agnostic about the specific relay management strategy being used. This allows developers to plug in different relay handlers to suit their needs.

## Interface Definition

The `RelayHandler` interface is defined in [`core/interfaces.ts`](/core/interfaces#relayhandler) and includes several key methods:

```typescript
export interface RelayHandler {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(filters: Filter[], onEvent: (event: NostrEvent) => void): void;
  unsubscribe(): void;
  publish(event: NostrEvent): void;
}
```

-   `connect()`: Establishes connections to the configured relays.
-   `disconnect()`: Closes connections to all relays.
-   `subscribe(filters, onEvent)`: Creates a subscription on the connected relays, listening for events that match the provided filters and passing them to the `onEvent` callback.
-   `unsubscribe()`: Closes all active subscriptions.
-   `publish(event)`: Publishes a Nostr event to the connected relays.

## Implementations

The SDK provides a default implementation for common use cases and allows for custom implementations for advanced scenarios.

-   **[SimpleRelayPool](./simple-relay-pool)**: The default implementation, which manages a simple pool of relays.
-   **[Custom Relay Handler](./custom-relay-handler)**: A guide to creating your own relay handler by implementing the `RelayHandler` interface.

## Next Steps

-   Learn about the default implementation: **[SimpleRelayPool](./simple-relay-pool)**
-   Learn how to create your own: **[Custom Relay Handler](./custom-relay-handler)**