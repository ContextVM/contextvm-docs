---
title: Nostr Client Transport
description: A client-side component for communicating with MCP servers over Nostr.
---

# Nostr Client Transport

The `NostrClientTransport` is a key component of the `@contextvm/sdk`, enabling MCP clients to communicate with remote MCP servers over the Nostr network. It implements the `Transport` interface from the `@modelcontextprotocol/sdk`, making it a plug-and-play solution for any MCP client.

## Overview

The `NostrClientTransport` handles all the complexities of Nostr-based communication, including:

- Connecting to Nostr relays.
- Subscribing to events from a specific server.
- Sending MCP requests as Nostr events.
- Receiving and processing responses and notifications.
- Handling encryption and decryption of messages.

By using this transport, an MCP client can interact with a Nostr-enabled MCP server without needing to implement any Nostr-specific logic itself.

## `NostrTransportOptions`

To create an instance of `NostrClientTransport`, you must provide a configuration object that implements the `NostrTransportOptions` interface:

```typescript
export interface NostrTransportOptions extends BaseNostrTransportOptions {
  serverPubkey: string;
  isStateless?: boolean;
}
```

- **`serverPubkey`**: The public key of the target MCP server. The transport will only listen for events from this public key.
- **`isStateless`** (optional): When set to `true`, enables stateless mode for the client transport. In stateless mode, the client emulates the server's initialize response without requiring a full server initialization roundtrip. This enables faster startup and reduced network overhead. Default is `false`.

## Usage Example

Here's how you can use the `NostrClientTransport` with an MCP client from the `@modelcontextprotocol/sdk`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client';
import { NostrClientTransport } from '@contextvm/sdk';
import { EncryptionMode } from '@contextvm/sdk';
import { PrivateKeySigner } from '@contextvm/sdk';
import { ApplesauceRelayPool } from '@contextvm/sdk';

// 1. Configure the signer and relay handler
const signer = new PrivateKeySigner('your-private-key'); // Replace with your actual private key
const relayPool = new ApplesauceRelayPool(['wss://relay.damus.io']);

// 2. Set the public key of the target server
const REMOTE_SERVER_PUBKEY = 'remote-server-public-key';

// 3. Create the transport instance
const clientNostrTransport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: REMOTE_SERVER_PUBKEY,
  encryptionMode: EncryptionMode.OPTIONAL,
});

// 4. Create and connect the MCP client
const mcpClient = new Client({
  name: 'My Client',
  version: '1.0.0',
});

await mcpClient.connect(clientNostrTransport);

// 5. Use the client to interact with the server
const tools = await mcpClient.listTools();
console.log('Available tools:', tools);

// 6. Close the connection when done
// await mcpClient.close();
```

> **Note**: The `relayHandler` option also accepts a `string[]` of relay URLs, in which case an `ApplesauceRelayPool` will be created automatically. See the [Base Nostr Transport](/transports/base-nostr-transport) documentation for details.

## How It Works

1.  **`start()`**: When `mcpClient.connect()` is called, it internally calls the transport's `start()` method. This method connects to the relays and subscribes to events targeting the client's public key.
    - In **stateless mode** (`isStateless: true`), the client emulates the server's initialize response without sending it over the network, skipping the `notifications/initialized` message exchange.
    - In **standard mode** (`isStateless: false` or undefined), the client performs the full initialization roundtrip with the server.
2.  **`send(message)`**: When you call an MCP method like `mcpClient.listTools()`, the client creates a JSON-RPC request and passes it to the transport's `send()` method. The transport then:
    - Wraps the message in a Nostr event.
    - Signs the event.
    - Optionally encrypts it.
    - Publishes it to the relays, targeting the `serverPubkey`.
3.  **Event Processing**: The transport listens for incoming events. When an event is received, it is decrypted (if necessary) and converted back into a JSON-RPC message.
    - If the message is a **response** (correlated by the original event ID), it is passed to the MCP client to resolve the pending request.
    - If the message is a **notification**, it is emitted through the `onmessage` handler.

## Stateless Mode

The stateless mode is designed to optimize performance by reducing the initialization overhead:

- **Faster Startup**: By emulating the initialize response, the client can begin operations immediately without waiting for server response.
- **Reduced Network Overhead**: Eliminates the need for the initialization roundtrip.
- **Use Cases**: Ideal for scenarios where the client needs to quickly connect and interact with the server, such as in serverless functions or short-lived processes.

To enable stateless mode, set `isStateless: true` in the transport configuration:

```typescript
const clientNostrTransport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: REMOTE_SERVER_PUBKEY,
  encryptionMode: EncryptionMode.OPTIONAL,
  isStateless: true, // Enable stateless mode
});
```

**Note**: The stateless mode might not work with all servers.

## Next Steps

Next, we will look at the server-side counterpart to this transport:

- **[Nostr Server Transport](/transports/nostr-server-transport)**: For exposing MCP servers to the Nostr network.
