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
  /** List of capabilities that are excluded from public key whitelisting requirements */
  excludedCapabilities?: CapabilityExclusion[];
  /** Log level for the NostrServerTransport: 'debug' | 'info' | 'warn' | 'error' | 'silent' */
  logLevel?: LogLevel;
  /**
   * Whether to inject the client's public key into the _meta field of incoming messages.
   * @default false
   */
  injectClientPubkey?: boolean;
}
```

- **`serverInfo`**: (Optional) Information about the server (`name`, `picture`, `website`) to be used in public announcements.
- **`isPublicServer`**: (Optional) If `true`, the transport will automatically announce the server's capabilities on the Nostr network. Defaults to `false`.
- **`allowedPublicKeys`**: (Optional) A list of client public keys that are allowed to connect. If not provided, any client can connect.
- **`excludedCapabilities`**: (Optional) A list of capabilities that are excluded from public key whitelisting requirements. This allows certain operations from disallowed public keys, enhancing security policy flexibility while maintaining backward compatibility.
- **`injectClientPubkey`**: (Optional) If `true`, the transport will inject the client's public key into the `_meta` field of requests passed to the underlying server. Defaults to `false`.

### Capability Exclusion

The `CapabilityExclusion` interface allows you to define specific capabilities that bypass the public key whitelisting requirements:

```typescript
/**
 * Represents a capability exclusion pattern that can bypass whitelisting.
 * Can be either a method-only pattern (e.g., 'tools/list') or a method + name pattern (e.g., 'tools/call, get_weather').
 */
export interface CapabilityExclusion {
  /** The JSON-RPC method to exclude from whitelisting (e.g., 'tools/call', 'tools/list') */
  method: string;
  /** Optional capability name to specifically exclude (e.g., 'get_weather') */
  name?: string;
}
```

#### How Capability Exclusion Works

Capability exclusion provides fine-grained control over access by allowing specific operations to be performed even by clients that are not in the `allowedPublicKeys` list. This is useful for:

- Allowing public access to server discovery endpoints like `tools/list`
- Permitting specific tool calls from untrusted clients
- Maintaining backward compatibility with existing clients

#### Exclusion Patterns

- **Method-only exclusion**: `{ method: 'tools/list' }` - Excludes all calls to the `tools/list` method
- **Method + name exclusion**: `{ method: 'tools/call', name: 'add' }` - Excludes only the `add` tool from the `tools/call` method

## Usage Example

Here's how to use the `NostrServerTransport` with an `McpServer` from the `@modelcontextprotocol/sdk`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NostrServerTransport } from "@contextvm/sdk";
import { PrivateKeySigner } from "@contextvm/sdk";
import { ApplesauceRelayPool } from "@contextvm/sdk";

// 1. Configure the signer and relay pool
const signer = new PrivateKeySigner("your-server-private-key");
const relayPool = new ApplesauceRelayPool(["wss://relay.damus.io"]);

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
  serverInfo: {
    name: "My Awesome MCP Server",
    website: "https://example.com",
  },
  allowedPublicKeys: ["trusted-client-key"], // Only allow specific clients
  excludedCapabilities: [
    { method: "tools/list" }, // Allow any client to list available tools
    { method: "tools/call", name: "get_weather" }, // Allow any client to call get_weather tool
  ],
  injectClientPubkey: true, // Enable client public key injection
});

// 4. Connect the server
await mcpServer.connect(serverNostrTransport);

console.log("MCP server is running and available on Nostr.");

// Keep the process running...
// To shut down: await mcpServer.close();
```

> **Note**: The `relayHandler` option also accepts a `string[]` of relay URLs, in which case an `ApplesauceRelayPool` will be created automatically. See the [Base Nostr Transport](/transports/base-nostr-transport) documentation for details.

## How It Works

1.  **`start()`**: When `mcpServer.connect()` is called, the transport connects to the relays and subscribes to events targeting the server's public key. If `isPublicServer` is `true`, it also initiates the announcement process.
2.  **Incoming Events**: The transport listens for events from clients. For each client, it maintains a `ClientSession`.
3.  **Request Handling**: When a valid request is received from an authorized client, the transport forwards it to the `McpServer`'s internal logic via the `onmessage` handler. It replaces the request's original ID with the unique Nostr event ID to prevent ID collisions between different clients.
    - If `injectClientPubkey` is enabled, the client's public key is injected into the request's `_meta` field before being passed to the server.
4.  **Response Handling**: When the `McpServer` sends a response, the transport's `send()` method is called. The transport looks up the original request details from the client's session, restores the original request ID, and sends the response back to the correct client, referencing the original event ID.
5.  **Announcements**: If `isPublicServer` is true, the transport sends requests to its own `McpServer` for `initialize`, `tools/list`, etc. It then formats the responses into the appropriate replaceable Nostr events (kinds 11316-11320) and publishes them.

## Session Management

The `NostrServerTransport` manages a session for each unique client public key. Each session tracks:

- If the client has completed the MCP initialization handshake.
- Whether the session is encrypted.
- A map of pending requests to correlate responses.
- The timestamp of the last activity, used for cleaning up inactive sessions.

## Security and Policy Flexibility

The capability exclusion feature provides enhanced security policy flexibility by allowing you to create a whitelist-based security model with specific exceptions. This approach is particularly useful for:

### Use Cases

1. **Public Discovery**: Allow any client to discover your server's capabilities via `tools/list` while restricting actual tool usage to authorized clients.

2. **Limited Public Access**: Permit specific, safe operations from untrusted clients while maintaining security for sensitive operations.

3. **Backward Compatibility**: Gradually introduce stricter security policies while maintaining compatibility with existing clients.

4. **Tiered Access**: Create different levels of access where certain capabilities are available to all clients, while others require explicit authorization.

## Client Public Key Injection

When the `injectClientPubkey` option is enabled, the transport injects the client's public key into the `_meta` field of requests passed to the underlying MCP server. This enables servers to access client identification information for authentication, authorization, and enhanced integration purposes.

### How It Works

1. When a request is received from a client, the transport extracts the client's public key from the Nostr event
2. The transport embeds the `clientPubkey` field in the message's `_meta` field
3. The modified request is then passed to the underlying server

The injected metadata follows this structure:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "example_tool",
    "arguments": {}
  },
  "_meta": {
    "clientPubkey": "<client-public-key-hex>"
  }
}
```

### Use Cases

- **Authentication**: Servers can verify client identity without additional protocol overhead
- **Authorization**: Implement per-client access controls based on public key
- **Logging**: Track client activity and usage patterns
- **Rate Limiting**: Apply rate limits on a per-client basis
- **Personalization**: Provide client-specific responses or data

## Next Steps

Now that you understand how the transports work, let's dive into the **[Signer](/signer/nostr-signer-interface)**, the component responsible for cryptographic signatures.
