---
title: Custom Relay Handler Development
description: Learn how to create a custom relay handler for the @contextvm/sdk.
---

# Custom Relay Handler Development

The `@contextvm/sdk`'s-pluggable architecture, centered around the [`RelayHandler`](/relay/relay-handler-interface) interface, allows developers to implement custom logic for managing Nostr-relay connections. This is particularly useful for advanced use cases that require more sophisticated behavior than what the default [`SimpleRelayPool`](/relay/simple-relay-pool) provides.

## Why Create a Custom Relay Handler?

You might want to create a custom `RelayHandler` for several reasons:

- **Intelligent Relay Selection**: To dynamically select relays based on performance, reliability, or the specific type of data being requested. For example, you might use a different set of relays for fetching user metadata versus broadcasting messages.
- **Auth Relays**: To integrate with auth relays that require authentication or specific connection logic.
- **Dynamic Relay Discovery**: To discover and connect to new relays at runtime, rather than using a static list.
- **Custom Caching**: To implement a custom caching layer to reduce redundant requests to relays.
- **Resiliency and-failover**: To build more robust-failover logic, such as automatically retrying failed connections or switching to backup relays.

## Non-Blocking Subscription Requirement

A critical requirement for implementing the `RelayHandler` interface is that the `subscribe` method must be **non-blocking**. This design ensures that the transport layer can create multiple subscriptions concurrently without waiting for each one to complete.

### Key Implementation Principles

1. **Immediate Return**: The `subscribe` method should return immediately after initiating the subscription
2. **Internal State Management**: Store active subscriptions internally for lifecycle management
3. **Automatic Reconnection**: Handle resubscription when connections are reestablished

## Implementing the `RelayHandler` Interface

To create a custom relay handler, you need to create a class that implements the `RelayHandler` interface. This involves implementing five methods: `connect`, `disconnect`, `publish`, `subscribe`, and `unsubscribe`.

### Implementation Pattern For Non-Blocking Subscriptions

```typescript
class MyRelayHandler implements RelayHandler {
  private subscriptions: Array<{
    filters: Filter[];
    onEvent: (event: NostrEvent) => void;
    onEose?: () => void;
    closer?: SubCloser; // Or similar subscription management object
  }> = [];

  async connect(): Promise<void> {
    // Connect to the relays
  }

  async disconnect(relayUrls?: string[]): Promise<void> {
    // Disconnect from the relays
  }

  async publish(event: NostrEvent): Promise<void> {
    // Publish the event to the relays
  }

  async subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
  ): Promise<void> {
    // Create the subscription (non-blocking)
    const closer = this.pool.subscribeMany(relayUrls, filters, {
      onevent: onEvent,
      oneose: onEose,
    });

    // Store the subscription for management
    this.subscriptions.push({ filters, onEvent, onEose, closer });
  }

  unsubscribe(): void {
    // Close all active subscriptions
    this.subscriptions.forEach((sub) => sub.closer?.close());
    this.subscriptions = [];
  }
}
```

This pattern is used by both [`SimpleRelayPool`](/relay/simple-relay-pool) and [`ApplesauceRelayPool`](/relay/applesauce-relay-pool) implementations.

## Using Your Custom Relay Handler

Once your custom handler class is created, you can instantiate it and pass it to any component that requires a `RelayHandler`, such as the `NostrClientTransport` or `NostrServerTransport`. The SDK will then use your custom logic for all relay interactions.

## Next Steps

With the `Relay` component covered, we will now look at the high-level bridging components provided by the SDK.

- **[Proxy](/proxy/overview)**
- **[Gateway](/overview)**
