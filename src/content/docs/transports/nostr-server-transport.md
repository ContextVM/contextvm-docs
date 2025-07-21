---
title: Nostr Server Transport
description: A server-side component for exposing MCP servers over Nostr.
---

# Nostr Server Transport

The `NostrServerTransport` is the server-side counterpart to the [`NostrClientTransport`](/transports/nostr-client-transport). It allows an MCP server to expose its capabilities to the Nostr network, making them discoverable and usable by any Nostr-enabled client. Like the client transport, it implements the `Transport` interface from the `@modelcontextprotocol/sdk`.

## Overview

The `NostrServerTransport` is responsible for:

- Listening for incoming MCP requests from Nostr clients.
- Managing individual client sessions and their state (e.g., initialization, encryption).
- Handling request/response correlation to ensure responses are sent to the correct client.
- Sending responses and notifications back to clients over Nostr.
- Optionally announcing the server and its capabilities to the network for public discovery.

## `NostrServerTransportOptions`

The transport is configured via the `NostrServerTransportOptions` interface:

```typescript
export interface NostrServerTransportOptions extends BaseNostrTransportOptions {
  serverInfo?: ServerInfo;
  isPublicServer?: boolean;
  allowedPublicKeys?: string[];
}
```

- **`serverInfo`**: (Optional) Information about the server (`name`, `picture`, `website`) to be used in public announcements.
- **`isPublicServer`**: (Optional) If `true`, the transport will automatically announce the server's capabilities on the Nostr network. Defaults to `false`.
- **`allowedPublicKeys`**: (Optional) A list of client public keys that are allowed to connect. If not provided, any client can connect.

## Usage Example

Here's how to use the `NostrServerTransport` with an `McpServer` from the `@modelcontextprotocol/sdk`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server";
import { NostrServerTransport } from "@ctxvm/sdk/transport";
import { PrivateKeySigner } from "@ctxvm/sdk/signer";
import { SimpleRelayPool } from "@ctxvm/sdk/relay";

// 1. Configure the signer and relay pool
const signer = new PrivateKeySigner("your-server-private-key");
const relayPool = new SimpleRelayPool(["wss://relay.damus.io"]);

// 2. Create the McpServer instance
const mcpServer = new McpServer({
  name: "demo-server",
  version: "1.0.0",
});

// Register your server's tools, resources, etc.
// mcpServer.tool(...);

// 3. Create the NostrServerTransport instance
const serverNostrTransport = new NostrServerTransport({
  signer: signer,
  relayHandler: relayPool,
  isPublicServer: true, // Announce the server publicly
  serverInfo: {
    name: "My Awesome MCP Server",
    website: "https://example.com",
  },
});

// 4. Connect the server
await mcpServer.connect(serverNostrTransport);

console.log("MCP server is running and available on Nostr.");

// Keep the process running...
// To shut down: await mcpServer.close();
```

## How It Works

1.  **`start()`**: When `mcpServer.connect()` is called, the transport connects to the relays and subscribes to events targeting the server's public key. If `isPublicServer` is `true`, it also initiates the announcement process.
2.  **Incoming Events**: The transport listens for events from clients. For each client, it maintains a `ClientSession`.
3.  **Request Handling**: When a valid request is received from an authorized client, the transport forwards it to the `McpServer`'s internal logic via the `onmessage` handler. It replaces the request's original ID with the unique Nostr event ID to prevent ID collisions between different clients.
4.  **Response Handling**: When the `McpServer` sends a response, the transport's `send()` method is called. The transport looks up the original request details from the client's session, restores the original request ID, and sends the response back to the correct client, referencing the original event ID.
5.  **Announcements**: If `isPublicServer` is true, the transport sends requests to its own `McpServer` for `initialize`, `tools/list`, etc. It then formats the responses into the appropriate replaceable Nostr events (kinds 11316-11320) and publishes them.

## Session Management

The `NostrServerTransport` manages a session for each unique client public key. Each session tracks:

- If the client has completed the MCP initialization handshake.
- Whether the session is encrypted.
- A map of pending requests to correlate responses.
- The timestamp of the last activity, used for cleaning up inactive sessions.

## Next Steps

Now that you understand how the transports work, let's dive into the **[Signer](/signer/nostr-signer-interface)**, the component responsible for cryptographic signatures.
