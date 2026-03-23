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
  /** @deprecated Use isAnnouncedServer instead. */
  isPublicServer?: boolean;
  isAnnouncedServer?: boolean;
  publishRelayList?: boolean;
  relayListUrls?: string[];
  bootstrapRelayUrls?: string[];
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
- **`isAnnouncedServer`**: (Optional) If `true`, the transport publishes public announcement events for relay-based discovery. Defaults to `false`.
- **`isPublicServer`**: (Deprecated) Legacy alias for `isAnnouncedServer`.
- **`publishRelayList`**: (Optional) If `true`, the transport publishes a NIP-65 relay list (`kind:10002`) even when `isAnnouncedServer` is `false`. Defaults to `true`.
- **`relayListUrls`**: (Optional) Explicit relay URLs to advertise in the published relay list. If omitted, the SDK derives them from the configured relay handler when possible.
- **`bootstrapRelayUrls`**: (Optional) Extra relays used only as publication targets for discoverability events such as `kind:11316` and `kind:10002`. These are not automatically advertised in the relay list.
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
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NostrServerTransport } from '@contextvm/sdk';
import { PrivateKeySigner } from '@contextvm/sdk';
import { ApplesauceRelayPool } from '@contextvm/sdk';

// 1. Configure the signer and relay pool
const signer = new PrivateKeySigner('your-server-private-key');
const relayPool = new ApplesauceRelayPool(['wss://relay.damus.io']);

// 2. Create the McpServer instance
const mcpServer = new McpServer({
  name: 'demo-server',
  version: '1.0.0',
});

// Register your server's tools, resources, etc.
// mcpServer.tool(...);

// 3. Create the NostrServerTransport instance
const serverNostrTransport = new NostrServerTransport({
  signer: signer,
  relayHandler: relayPool,
  isAnnouncedServer: true,
  publishRelayList: true,
  bootstrapRelayUrls: ['wss://relay.damus.io', 'wss://nos.lol'],
  serverInfo: {
    name: 'My Awesome MCP Server',
    website: 'https://example.com',
  },
  allowedPublicKeys: ['trusted-client-key'], // Only allow specific clients
  excludedCapabilities: [
    { method: 'tools/list' }, // Allow any client to list available tools
    { method: 'tools/call', name: 'get_weather' }, // Allow any client to call get_weather tool
  ],
  injectClientPubkey: true, // Enable client public key injection
});

// 4. Connect the server
await mcpServer.connect(serverNostrTransport);

console.log('MCP server is running and available on Nostr.');

// Keep the process running...
// To shut down: await mcpServer.close();
```

> **Note**: The `relayHandler` option also accepts a `string[]` of relay URLs, in which case an `ApplesauceRelayPool` will be created automatically. See the [Base Nostr Transport](/transports/base-nostr-transport) documentation for details.

## How It Works

1.  **`start()`**: When `mcpServer.connect()` is called, the transport connects to the relays and subscribes to events targeting the server's public key. If `isAnnouncedServer` is `true`, it publishes public announcement events. Independently, if `publishRelayList` is enabled, it also publishes relay-list metadata.
2.  **Incoming Events**: The transport listens for events from clients. For each client, it maintains a `ClientSession`.
3.  **Request Handling**: When a valid request is received from an authorized client, the transport forwards it to the `McpServer`'s internal logic via the `onmessage` handler. It replaces the request's original ID with the unique Nostr event ID to prevent ID collisions between different clients.
    - If `injectClientPubkey` is enabled, the client's public key is injected into the request's `_meta` field before being passed to the server.
4.  **Response Handling**: When the `McpServer` sends a response, the transport's `send()` method is called. The transport looks up the original request details from the client's session, restores the original request ID, and sends the response back to the correct client, referencing the original event ID.
5.  **Discoverability publication**: Public announcement events (kinds 11316-11320) are controlled by `isAnnouncedServer`. Relay-list metadata (`kind:10002`) is controlled independently by `publishRelayList`.

## Relay List Discoverability

Servers can publish a NIP-65 relay list so clients can discover where the server is reachable.

### Default Behavior

- `isAnnouncedServer: true` enables public announcement publication
- `publishRelayList` defaults to `true` for both public and private servers
- if `relayListUrls` is omitted, the SDK derives advertised relays from the configured relay handler when possible
- `bootstrapRelayUrls` can be used to publish discoverability events to extra relays without advertising them as operational relays

### Why bootstrap relays exist

Operational relays and discoverability relays do not always need to be identical:

- **Operational relays** are where the server actually handles requests and responses
- **Bootstrap relays** are additional relays used to make the server easier to discover

This separation helps keep the published relay list focused while still improving network visibility.

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

## Structured Tool Outputs

`NostrServerTransport` does not change the MCP tool result model, so structured outputs work the same way they do on any other MCP transport. This is especially useful when your server is meant for programmatic usage and clients should be able to depend on a stable result shape.

Define an `outputSchema` on the tool and return `structuredContent` from the handler:

```typescript
import * as z from 'zod/v4';

server.registerTool(
  'get_weather',
  {
    description: 'Get weather information for a city',
    inputSchema: z.object({
      city: z.string(),
      country: z.string(),
    }),
    outputSchema: z.object({
      temperature: z.object({
        celsius: z.number(),
        fahrenheit: z.number(),
      }),
      conditions: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']),
      humidity: z.number().min(0).max(100),
    }),
  },
  async ({ city, country }) => {
    const structuredContent = {
      temperature: {
        celsius: 22,
        fahrenheit: 71.6,
      },
      conditions: 'sunny' as const,
      humidity: 45,
    };

    return {
      content: [
        {
          type: 'text',
          text: `Weather for ${city}, ${country}: ${structuredContent.temperature.celsius}°C and ${structuredContent.conditions}.`,
        },
      ],
      structuredContent,
    };
  }
);
```

Guidance:

- Use `structuredContent` for machine-readable output.
- Use `content` for human-readable output only.
- `content` does not need to duplicate `structuredContent`.
- If no human-readable output is needed, `content` can be `[]`.

## Next Steps

Now that you understand how the transports work, let's dive into the **[Signer](/signer/nostr-signer-interface)**, the component responsible for cryptographic signatures.
