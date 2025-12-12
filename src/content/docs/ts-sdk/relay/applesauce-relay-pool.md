---
title: ApplesauceRelayPool
description: An advanced relay handler implementation using the applesauce-relay library for the @contextvm/sdk.
---

# `ApplesauceRelayPool`

The `ApplesauceRelayPool` is an advanced implementation of the [`RelayHandler`](/relay/relay-handler-interface) interface that uses the `applesauce-relay` library. It provides sophisticated relay management with automatic reconnection, connection monitoring, and robust subscription handling.

## Overview

The `ApplesauceRelayPool` offers enhanced features compared to the basic [`SimpleRelayPool`](/relay/simple-relay-pool):

- **Automatic Connection Management**: Uses `RelayPool` for efficient connection handling
- **Connection Monitoring**: Monitors relay connections and automatically resubscribes when connections are lost
- **Retry Logic**: Built-in retry mechanisms for failed operations
- **Observable-based Architecture**: Leverages RxJS-style observables for event handling
- **Advanced Subscription Management**: Persistent subscriptions with automatic reconnection

This implementation is ideal for applications that require more sophisticated relay management and better resilience against network interruptions.

## `constructor(relayUrls: string[])`

The constructor takes a single argument:

- **`relayUrls`**: An array of strings, where each string is the URL of a Nostr relay (e.g., `wss://relay.damus.io`).

## Usage Example

```typescript
import { ApplesauceRelayPool } from "@contextvm/sdk";
import { NostrClientTransport } from "@contextvm/sdk";

// 3. Pass the instance to a transport
const transport = new NostrClientTransport({
  relayHandler: new ApplesauceRelayPool([
    "wss://relay1.com",
    "wss://relay2.io",
  ]),
  // ... other options
});
```

## How It Works

The `ApplesauceRelayPool` implements the `RelayHandler` interface using the `applesauce-relay` library:

### Connection Management

- **`connect()`**: Validates relay URLs and initializes the `RelayPool`. The pool automatically manages connections to relays as needed.
- **`disconnect()`**: Closes all active subscriptions and clears internal state. Note that the underlying `RelayPool` manages connections automatically.

### Event Publishing

- **`publish(event)`**: Uses `relayGroup.publish()` which includes automatic retry logic. The method returns a Promise that resolves when the publish operation completes.

### Subscription Management

- **`subscribe(filters, onEvent, onEose)`**: Creates a persistent subscription using `relayGroup.subscription()` with automatic reconnection. Subscriptions are tracked internally for lifecycle management.
- **`unsubscribe()`**: Closes all active subscriptions and clears the internal subscription tracking.

### Advanced Features

#### Connection Monitoring

The pool automatically monitors relay connections and triggers resubscription when connections are lost:

```typescript
private setupConnectionMonitoring(): void {
  this.pool.relays$.subscribe((relays) => {
    relays.forEach((relay) => {
      relay.connected$.subscribe((connected) => {
        if (!connected) {
          this.resubscribeAll();
        }
      });
    });
  });
}
```

#### Automatic Resubscription

When a relay connection is lost and reestablished, the pool automatically resubscribes to all active subscriptions:

```typescript
private resubscribeAll(): void {
  this.subscriptions.forEach((sub) => {
    if (sub.closer) sub.closer.unsubscribe();
    sub.closer = this.createSubscription(
      sub.filters,
      sub.onEvent,
      sub.onEose,
    );
  });
}
```

#### Error Handling

The implementation includes comprehensive error handling for both publishing and subscription operations:

- **Publish Errors**: Logs warnings for failed publishes but doesn't reject the Promise unless there's a critical error
- **Subscription Errors**: Removes failed subscriptions from tracking and logs the error

## Key Differences from SimpleRelayPool

| Feature                      | SimpleRelayPool                      | ApplesauceRelayPool                       |
| ---------------------------- | ------------------------------------ | ----------------------------------------- |
| **Library**                  | `nostr-tools`                        | `applesauce-relay`                        |
| **Connection Management**    | Manual connection tracking           | Automatic connection management           |
| **Reconnection**             | Manual reconnection logic            | Automatic reconnection with monitoring    |
| **Retry Logic**              | Basic retry with exponential backoff | Built-in retry mechanisms                 |
| **Subscription Persistence** | Manual resubscription                | Automatic resubscription on reconnect     |
| **Error Handling**           | Basic error logging                  | Comprehensive error handling with cleanup |

## When to Use ApplesauceRelayPool

Consider using `ApplesauceRelayPool` when:

- You need robust connection management and automatic reconnection
- Your application requires high availability and resilience
- You want advanced subscription management with automatic recovery
- You're building a production application that needs to handle network interruptions gracefully

For simpler use cases or when you want to minimize dependencies, the [`SimpleRelayPool`](/relay/simple-relay-pool) may be sufficient.

## Next Steps

- Learn how to build a custom relay handler: **[Custom Relay Handler](/relay/custom-relay-handler)**
- Understand the relay handler interface: **[Relay Handler Interface](/relay/relay-handler-interface)**
