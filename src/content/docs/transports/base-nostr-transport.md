---
title: Base Nostr Transport
description: An abstract class that provides the core functionality for all Nostr-based transports in the @contextvm/sdk.
---

# Base Nostr Transport

The `BaseNostrTransport` is an abstract class that provides the core functionality for all Nostr-based transports in the `@contextvm/sdk`. It serves as the foundation for the [`NostrClientTransport`](../nostr-client-transport) and [`NostrServerTransport`](/transport/nostr-server-transport), handling the common logic for connecting to relays, managing subscriptions, and converting messages between the MCP and Nostr formats.

## Core Responsibilities

The `BaseNostrTransport` is responsible for:

-   **Connection Management**: Establishing and terminating connections to the Nostr relay network via a `RelayHandler`.
-   **Event Serialization**: Converting MCP JSON-RPC messages into Nostr events and vice-versa.
-   **Cryptographic Operations**: Signing Nostr events using a `NostrSigner`.
-   **Message Publishing**: Publishing events to the Nostr network.
-   **Subscription Management**: Creating and managing subscriptions to listen for relevant events.
-   **Encryption Handling**: Managing the encryption and decryption of messages based on the configured `EncryptionMode`.

## `BaseNostrTransportOptions`

When creating a transport that extends `BaseNostrTransport`, you must provide a configuration object that implements the `BaseNostrTransportOptions` interface:

```typescript
export interface BaseNostrTransportOptions {
  signer: NostrSigner;
  relayHandler: RelayHandler;
  encryptionMode?: EncryptionMode;
}
```

-   **`signer`**: An instance of a `NostrSigner` for signing events. This is a required parameter.
-   **`relayHandler`**: An instance of a `RelayHandler` for managing relay connections. This is a required parameter.
-   **`encryptionMode`**: An optional `EncryptionMode` enum that determines the encryption policy for the transport. Defaults to `OPTIONAL`.

## Key Methods

The `BaseNostrTransport` provides several protected methods that are used by its subclasses to implement their specific logic:

-   `connect()`: Connects to the configured Nostr relays.
-   `disconnect()`: Disconnects from the relays and clears subscriptions.
-   `subscribe(filters, onEvent)`: Subscribes to Nostr events that match the given filters.
-   `sendMcpMessage(...)`: Converts an MCP message to a Nostr event, signs it, optionally encrypts it, and publishes it to the network.
-   `createSubscriptionFilters(...)`: A helper method to create standard filters for listening to messages directed at a specific public key.

## How It Fits Together

The `BaseNostrTransport` encapsulates the shared logic of Nostr communication, allowing the `NostrClientTransport` and `NostrServerTransport` to focus on their specific roles in the client-server interaction model. By building on this common base, the SDK ensures consistent behavior and a unified approach to handling MCP over Nostr.

## Next Steps

Now that you understand the foundation of the Nostr transports, let's explore the concrete implementations:

-   **[Nostr Client Transport](./nostr-client-transport)**: For building MCP clients that communicate over Nostr.
-   **[Nostr Server Transport](./nostr-server-transport)**: For exposing MCP servers to the Nostr network.