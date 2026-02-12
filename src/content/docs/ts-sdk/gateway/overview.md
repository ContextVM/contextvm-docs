---
title: Gateway Overview
description: Understanding the NostrMCPGateway component for bridging MCP and Nostr
---

# Gateway

The `NostrMCPGateway` is a server-side bridging component that exposes a traditional MCP server to the Nostr network. It acts as a gateway, translating communication between Nostr-based clients and a standard MCP server.

## Purpose and Capabilities

The gateway manages two transports simultaneously:

1.  **Nostr Server Transport**: A [`NostrServerTransport`](/transports/nostr-server-transport) that listens for incoming connections from clients on the Nostr network.
2.  **MCP Server Transport**: A standard MCP client transport (like `StdioClientTransport`) that connects to a local or remote MCP server.

The gateway's role is to forward requests from Nostr clients to the MCP server and relay the server's responses back to the appropriate client on Nostr.

## Integration Scenarios

The `NostrMCPGateway` is ideal for:

- **Exposing Existing Servers**: If you have an existing MCP server, you can use the gateway to make it accessible to Nostr clients without modifying the server's core logic. The server continues to operate with its standard transport, while the gateway handles all Nostr-related communication.
- **Decoupling Services**: You can run your core MCP server in a secure environment and use the gateway as a public-facing entry point on the Nostr network. The gateway can be configured with its own security policies (like `allowedPublicKeys`).
- **Adding Nostr Capabilities**: It allows you to add features like public server announcements and decentralized discovery to a conventional MCP server.
- **Per-Client Isolation**: With the per-client routing feature, you can isolate MCP sessions per Nostr client, ensuring each client has their own dedicated connection to the backend MCP server.

## `NostrMCPGatewayOptions`

To create a `NostrMCPGateway`, you need to provide a configuration object that implements the `NostrMCPGatewayOptions` interface:

```typescript
export interface NostrMCPGatewayOptions {
  /**
   * The MCP client transport to connect to the original MCP server.
   * Required unless `createMcpClientTransport` is provided.
   */
  mcpClientTransport?: Transport;

  /** Options for configuring the Nostr server transport */
  nostrTransportOptions: NostrServerTransportOptions;

  /**
   * Optional factory for creating per-client MCP transports keyed by
   * Nostr client pubkey. If provided, the gateway will isolate MCP
   * sessions per pubkey.
   */
  createMcpClientTransport?: (ctx: {
    clientPubkey: string;
  }) => Transport | Promise<Transport>;

  /** Maximum number of per-client MCP transports to keep in memory.
   *  @default 1000
   */
  maxClientTransports?: number;
}
```

### Option Details

- **`mcpClientTransport`** (optional): An instance of a client-side MCP transport that the gateway will use to connect to your existing MCP server.

  **Note**: You must provide either `mcpClientTransport` OR `createMcpClientTransport`, but not both.

- **`nostrTransportOptions`**: The full configuration object required by the `NostrServerTransport`. This includes the `signer`, `relayHandler`, and options like `isPublicServer`.

- **`createMcpClientTransport`** (optional): A factory function that creates a new MCP transport for each unique Nostr client (identified by their public key). This enables per-client session isolation. The function receives a context object containing the `clientPubkey`.

- **`maxClientTransports`** (optional): When using `createMcpClientTransport`, this sets the maximum number of per-client transports to cache in memory. When the limit is exceeded, the least recently used transport is closed and evicted. Defaults to `1000`.

## Operation Modes

The gateway supports two operation modes:

### Single-Client Mode (Shared Transport)

In this mode, all Nostr clients share a single MCP transport connection to the backend server. This is suitable when:

- The MCP server is stateless or handles its own session management, like stdio transports
- You want to minimize resource usage
- The MCP server doesn't support multiple concurrent connections efficiently

```typescript
const gateway = new NostrMCPGateway({
  mcpClientTransport: new StdioClientTransport({
    command: 'bun',
    args: ['run', 'path/to/your/mcp-server.ts'],
  }),
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
  },
});
```

### Per-Client Mode (Isolated Transports)

In this mode, each Nostr client gets their own dedicated MCP transport. This is suitable when:

- The MCP server maintains state per connection
- You need complete isolation between clients
- You're using stateful transports like Streamable HTTP
- Each client should have their own backend process

```typescript
const gateway = new NostrMCPGateway({
  createMcpClientTransport: ({ clientPubkey: _clientPubkey }) =>
    new StreamableHTTPClientTransport(new URL(target)),
  maxClientTransports: 500, // Optional: limit cache size
  nostrTransportOptions,
});
```

## Usage Examples

### Basic Example (Single-Client Mode)

This example shows how to create a gateway that connects to a local MCP server (running in a separate process) and exposes it to the Nostr network.

```typescript
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { NostrMCPGateway } from '@contextvm/sdk';
import { PrivateKeySigner } from '@contextvm/sdk';
import { SimpleRelayPool } from '@contextvm/sdk';

// 1. Configure the signer and relay handler for the Nostr transport
const signer = new PrivateKeySigner('your-gateway-private-key');
const relayPool = new SimpleRelayPool(['wss://relay.damus.io']);

// 2. Configure the transport to connect to your existing MCP server
const clientTransport = new StdioClientTransport({
  command: 'bun',
  args: ['run', 'path/to/your/mcp-server.ts'],
});

// 3. Create the gateway instance
const gateway = new NostrMCPGateway({
  mcpClientTransport: clientTransport,
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
  },
});

// 4. Start the gateway
await gateway.start();

console.log('Gateway is running, exposing the MCP server to Nostr.');

// To stop the gateway: await gateway.stop();
```

### Per-Client Routing Example

This example shows how to use per-client routing with `StreamableHTTPClientTransport` to isolate MCP sessions per Nostr client:

```typescript
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { NostrMCPGateway } from '@contextvm/sdk';
import { PrivateKeySigner } from '@contextvm/sdk';
import { ApplesauceRelayPool } from '@contextvm/sdk';

const signer = new PrivateKeySigner('your-gateway-private-key');
const relayPool = new ApplesauceRelayPool(['wss://relay.damus.io']);
const target = 'http://localhost:3000/mcp';

const gateway = new NostrMCPGateway({
  // Factory function creates a new transport for each unique client pubkey
  createMcpClientTransport: ({ clientPubkey: _clientPubkey }) =>
    new StreamableHTTPClientTransport(new URL(target)),

  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
  },
});

await gateway.start();
console.log('Gateway running with per-client routing enabled.');
```

### Transport Recreation on Re-initialization

When using per-client mode, the gateway automatically handles transport recreation when a client reconnects. If a client sends a new `initialize` request, the gateway will:

1. Close the existing transport for that client (if any)
2. Create a fresh transport via the `createMcpClientTransport` factory
3. Continue with the new initialization

This prevents "already initialized" errors with stateful transports like Streamable HTTP and ensures clean session boundaries.

```typescript
// Example: Client reconnects - transport is automatically recreated
const client1 = new Client({ name: 'client-1', version: '1.0.0' });
await client1.connect(transport1);
await client1.listTools(); // Uses transport instance #1

await client1.close();
await sleep(100);

// Reconnect - gateway automatically creates a new transport
await client1.connect(transport2);
await client1.listTools(); // Uses fresh transport instance #2
```

## Session Eviction and Cleanup

When using per-client mode with session limits (`maxSessions` in `nostrTransportOptions`):

1. When the session limit is reached and a new client connects, the oldest session is evicted
2. The gateway automatically closes the MCP transport for the evicted client
3. The `maxClientTransports` option controls the LRU cache for MCP transports independently

This ensures resource cleanup and prevents memory leaks in long-running gateways.

## Error Handling

The gateway handles errors from both transports:

- **Nostr transport errors**: Logged via the internal logger
- **MCP server errors**: Forwarded appropriately; per-client errors are isolated
- **Transport cleanup errors**: Handled gracefully during session eviction

## Next Steps

This concludes the core components of the SDK. The final section provides practical examples of how to use these components together.

- **[Tutorials](/tutorials/client-server-communication)**
