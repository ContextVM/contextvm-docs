---
title: Custom Relay Handler Development
description: Learn how to create a custom relay handler for the @contextvm/sdk.
---

# Custom Relay Handler Development

The `@contextvm/sdk`'s-pluggable architecture, centered around the [`RelayHandler`](/contextvm-docs/relay/relay-handler-interface) interface, allows developers to implement custom logic for managing Nostr-relay connections. This is particularly useful for advanced use cases that require more sophisticated behavior than what the default [`SimpleRelayPool`](/contextvm-docs/relay/simple-relay-pool) provides.

## Why Create a Custom Relay Handler?

You might want to create a custom `RelayHandler` for several reasons:

- **Intelligent Relay Selection**: To dynamically select relays based on performance, reliability, or the specific type of data being requested. For example, you might use a different set of relays for fetching user metadata versus broadcasting messages.
- **Auth Relays**: To integrate with auth relays that require authentication or specific connection logic.
- **Dynamic Relay Discovery**: To discover and connect to new relays at runtime, rather than using a static list.
- **Custom Caching**: To implement a custom caching layer to reduce redundant requests to relays.
- **Resiliency and-failover**: To build more robust-failover logic, such as automatically retrying failed connections or switching to backup relays.

## Implementing the `RelayHandler` Interface

To create a custom relay handler, you need to create a class that implements the `RelayHandler` interface. This involves implementing five methods: `connect`, `disconnect`, `publish`, `subscribe`, and `unsubscribe`.

### Example: A Handler with logging

Here is a simple example of a custom `RelayHandler` that wraps the default `SimpleRelayPool` and adds logging to each operation. This illustrates how you can extend or compose existing handlers.

```typescript
import { RelayHandler } from "@ctxvm/sdk/core";
import { SimpleRelayPool } from "@ctxvm/sdk/relay";
import { Filter, NostrEvent } from "nostr-tools";

class LoggingRelayHandler implements RelayHandler {
  private readonly innerHandler: RelayHandler;

  constructor(relayUrls: string[]) {
    this.innerHandler = new SimpleRelayPool(relayUrls);
    console.log(
      `[LoggingRelayHandler] Initialized with relays: ${relayUrls.join(", ")}`,
    );
  }

  async connect(): Promise<void> {
    console.log("[LoggingRelayHandler] Attempting to connect...");
    await this.innerHandler.connect();
    console.log("[LoggingRelayHandler] Connected successfully.");
  }

  async disconnect(): Promise<void> {
    console.log("[LoggingRelayHandler] Disconnecting...");
    await this.innerHandler.disconnect();
    console.log("[LoggingRelayHandler] Disconnected.");
  }

  publish(event: NostrEvent): void {
    console.log(`[LoggingRelayHandler] Publishing event kind ${event.kind}...`);
    this.innerHandler.publish(event);
  }

  subscribe(filters: Filter[], onEvent: (event: NostrEvent) => void): void {
    console.log(`[LoggingRelayHandler] Subscribing with filters:`, filters);
    this.innerHandler.subscribe(filters, (event) => {
      console.log(`[LoggingRelayHandler] Received event kind ${event.kind}`);
      onEvent(event);
    });
  }

  unsubscribe(): void {
    console.log("[LoggingRelayHandler] Unsubscribing from all.");
    this.innerHandler.unsubscribe();
  }
}

// Usage
const loggingHandler = new LoggingRelayHandler(["wss://relay.damus.io"]);

const transport = new NostrClientTransport({
  relayHandler: loggingHandler,
  // ... other options
});
```

This example demonstrates the composition pattern. For a more advanced handler, you might use a different underlying relay management library or implement the connection logic from scratch using WebSockets.

## Using Your Custom Relay Handler

Once your custom handler class is created, you can instantiate it and pass it to any component that requires a `RelayHandler`, such as the `NostrClientTransport` or `NostrServerTransport`. The SDK will then use your custom logic for all relay interactions.

## Next Steps

With the `Relay` component covered, we will now look at the high-level bridging components provided by the SDK.

- **[Proxy](/contextvm-docs/proxy/overview)**
- **[Gateway](/contextvm-docs/gateway/overview)**
