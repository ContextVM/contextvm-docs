---
title: Gateway Overview
description: Understanding the NostrMCPGateway component for bridging MCP and Nostr
---

# Gateway

The `NostrMCPGateway` is a server-side bridging component that exposes a traditional MCP server to the Nostr network. It acts as a gateway, translating communication between Nostr-based clients and a standard MCP server.

## Purpose and Capabilities

The gateway manages two transports simultaneously:

1.  **Nostr Server Transport**: A [`NostrServerTransport`](/contextvm-docs/transports/nostr-server-transport) that listens for incoming connections from clients on the Nostr network.
2.  **MCP Server Transport**: A standard MCP client transport (like `StdioClientTransport`) that connects to a local or remote MCP server.

The gateway's role is to forward requests from Nostr clients to the MCP server and relay the server's responses back to the appropriate client on Nostr.

## Integration Scenarios

The `NostrMCPGateway` is ideal for:

-   **Exposing Existing Servers**: If you have an existing MCP server, you can use the gateway to make it accessible to Nostr clients without modifying the server's core logic. The server continues to operate with its standard transport, while the gateway handles all Nostr-related communication.
-   **Decoupling Services**: You can run your core MCP server in a secure environment and use the gateway as a public-facing entry point on the Nostr network. The gateway can be configured with its own security policies (like `allowedPublicKeys`).
-   **Adding Nostr Capabilities**: It allows you to add features like public server announcements and decentralized discovery to a conventional MCP server.

## `NostrMCPGatewayOptions`

To create a `NostrMCPGateway`, you need to provide a configuration object that implements the `NostrMCPGatewayOptions` interface:

```typescript
export interface NostrMCPGatewayOptions {
  mcpServerTransport: Transport;
  nostrTransportOptions: NostrServerTransportOptions;
}
```

-   **`mcpServerTransport`**: An instance of a client-side MCP transport that the gateway will use to connect to your existing MCP server. For example, `new StdioClientTransport(...)`.
-   **`nostrTransportOptions`**: The full configuration object required by the `NostrServerTransport`. This includes the `signer`, `relayHandler`, and options like `isPublicServer`.

## Usage Example

This example shows how to create a gateway that connects to a local MCP server (running in a separate process) and exposes it to the Nostr network.

```typescript
import { StdioClientTransport } from '@modelcontextprotocol/sdk/stdio';
import { NostrMCPGateway } from '@ctxvm/sdk/gateway';
import { PrivateKeySigner } from '@ctxvm/sdk/signer';
import { SimpleRelayPool } from '@ctxvm/sdk/relay';

// 1. Configure the signer and relay handler for the Nostr transport
const signer = new PrivateKeySigner('your-gateway-private-key');
const relayPool = new SimpleRelayPool(['wss://relay.damus.io']);

// 2. Configure the transport to connect to your existing MCP server
const serverTransport = new StdioClientTransport({
  command: 'bun',
  args: ['run', 'path/to/your/mcp-server.ts'],
});

// 3. Create the gateway instance
const gateway = new NostrMCPGateway({
  mcpServerTransport: serverTransport,
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
    isPublicServer: true, // Announce this gateway on Nostr
  },
});

// 4. Start the gateway
await gateway.start();

console.log('Gateway is running, exposing the MCP server to Nostr.');

// To stop the gateway: await gateway.stop();
```

## Next Steps

This concludes the core components of the SDK. The final section provides practical examples of how to use these components together.

-   **[Tutorials](/contextvm-docs/tutorials/client-server-communication)**