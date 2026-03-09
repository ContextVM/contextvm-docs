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
- Working with server discovery flows based on announcements and relay-list metadata.

By using this transport, an MCP client can interact with a Nostr-enabled MCP server without needing to implement any Nostr-specific logic itself.

## `NostrTransportOptions`

To create an instance of `NostrClientTransport`, you must provide a configuration object that implements the `NostrTransportOptions` interface:

```typescript
export interface NostrTransportOptions extends BaseNostrTransportOptions {
  serverPubkey: string;
  discoveryRelayUrls?: string[];
  isStateless?: boolean;
}
```

- **`serverPubkey`**: The target server identity. Accepts a hex pubkey, `npub`, or `nprofile`. The transport normalizes this to the server's hex public key internally.
- **`discoveryRelayUrls`** (optional): Relay URLs used only for CEP-17 relay-list discovery when no operational relays are explicitly configured.
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

// 2. Set the identity of the target server
const REMOTE_SERVER = "npub1...";

// 3. Create the transport instance
const clientNostrTransport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: REMOTE_SERVER,
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

### Identity input precedence

[`NostrClientTransport`](contextvm-docs/src/content/docs/ts-sdk/transports/nostr-client-transport.md:56) resolves server identity and relays conservatively:

1. explicit operational relays from `relayHandler`
2. relay hints embedded in `nprofile`
3. CEP-17 relay-list discovery via `discoveryRelayUrls`

This keeps the active relay set minimal and avoids automatically merging every possible relay source.

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

## Server Discovery and Relay Selection

The client transport accepts a known [`serverPubkey`](contextvm-docs/src/content/docs/ts-sdk/transports/nostr-client-transport.md:28) in multiple forms and can now resolve operational relays automatically when needed.

Typical flow:

1. If explicit operational relays are configured, the transport uses them directly.
2. Else, if the server identity is an `nprofile` with relay hints, the transport uses those hints as the operational relay set.
3. Else, if [`discoveryRelayUrls`](contextvm-docs/src/content/docs/ts-sdk/transports/nostr-client-transport.md:30) is provided, the transport queries the server's `kind:10002` relay-list metadata.
4. The transport prefers unmarked `r` tags as the operational relay set, matching the recommended ContextVM profile in [`CEP-17`](contextvm-docs/src/content/docs/spec/ceps/cep-17.md:52).

Example with discovery fallback:

```typescript
import {
  EncryptionMode,
  NostrClientTransport,
  PrivateKeySigner,
} from '@contextvm/sdk';

const clientNostrTransport = new NostrClientTransport({
  signer: new PrivateKeySigner('your-private-key'),
  relayHandler: [],
  serverPubkey: 'nprofile1...',
  discoveryRelayUrls: ['wss://relay.damus.io', 'wss://nos.lol'],
  encryptionMode: EncryptionMode.OPTIONAL,
});
```

### Important distinction

Servers may publish discoverability events to additional bootstrap relays that are not included in their advertised `kind:10002` relay list. Clients should treat the published `r` tags as the authoritative operational relay set, while bootstrap relays are only helpful for finding that metadata in the first place.

Under the recommended ContextVM profile, clients should expect unmarked `r` tags and use them first. Directional `read` / `write` markers are treated as compatibility hints rather than the normal case.

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
  serverPubkey: REMOTE_SERVER,
  encryptionMode: EncryptionMode.OPTIONAL,
  isStateless: true, // Enable stateless mode
});
```

**Note**: The stateless mode might not work with all servers.

## Next Steps

Next, we will look at the server-side counterpart to this transport:

- **[Nostr Server Transport](/transports/nostr-server-transport)**: For exposing MCP servers to the Nostr network.
