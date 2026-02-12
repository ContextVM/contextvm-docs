---
title: Proxy Overview
description: A client-side bridging component for the @contextvm/sdk.
---

# Proxy

The `NostrMCPProxy` is a powerful, client-side bridging component in the `@contextvm/sdk`. Its primary function is to act as a local proxy that translates communication between a standard MCP client and a remote, Nostr-based MCP server.

## Functionality Overview

The proxy manages two transports simultaneously:

1.  **MCP Host Transport**: This is a standard MCP transport (like `StdioServerTransport`) that communicates with a local MCP client application.
2.  **Nostr Client Transport**: This is a [`NostrClientTransport`](/transports/nostr-client-transport) that communicates with the remote MCP server over the Nostr network.

The proxy sits in the middle, seamlessly forwarding messages between these two transports. When the local client sends a request, the proxy forwards it over Nostr. When the remote server sends a response, the proxy relays it back to the local client.

## Use Cases and Capabilities

The `NostrMCPProxy` is particularly useful in the following scenarios:

- **Integrating with Existing Clients**: If you have an existing MCP client that does not have native Nostr support, you can use the proxy to enable it to communicate with Nostr-based MCP servers without modifying the client's code. The client simply connects to the proxy's local transport.
- **Simplifying Client-Side Logic**: The proxy abstracts away all the complexities of Nostr communication (signing, relay management, encryption), allowing your main client application to remain simple and focused on its core tasks.
- **Local Development and Testing**: The proxy can be a valuable tool for local development, allowing you to easily test a client against a remote Nostr server.

## `NostrMCPProxyOptions`

To create a `NostrMCPProxy`, you need to provide a configuration object that implements the `NostrMCPProxyOptions` interface:

```typescript
export interface NostrMCPProxyOptions {
  mcpHostTransport: Transport;
  nostrTransportOptions: NostrTransportOptions;
}
```

- **`mcpHostTransport`**: An instance of a server-side MCP transport that the local client will connect to. For example, `new StdioServerTransport()`.
- **`nostrTransportOptions`**: The full configuration object required by the `NostrClientTransport`. This includes the `signer`, `relayHandler`, and the remote `serverPubkey`.

## Usage Example

This example demonstrates how to create a proxy that listens for a local client over standard I/O and connects to a remote server over Nostr.

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NostrMCPProxy } from '@contextvm/sdk';
import { PrivateKeySigner } from '@contextvm/sdk';
import { SimpleRelayPool } from '@contextvm/sdk';

// 1. Configure the signer and relay handler for the Nostr connection
const signer = new PrivateKeySigner('your-private-key');
const relayPool = new SimpleRelayPool(['wss://relay.damus.io']);
const REMOTE_SERVER_PUBKEY = 'remote-server-public-key';

// 2. Configure the transport for the local client
// In this case, a stdio transport that the local client can connect to
const hostTransport = new StdioServerTransport();

// 3. Create the proxy instance
const proxy = new NostrMCPProxy({
  mcpHostTransport: hostTransport,
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
    serverPubkey: REMOTE_SERVER_PUBKEY,
  },
});

// 4. Start the proxy
await proxy.start();

console.log('Proxy is running. Connect your local MCP client.');

// To stop the proxy: await proxy.stop();
```

In this setup, a separate MCP client process could connect to this proxy's `StdioServerTransport` and it would be transparently communicating with the remote server on Nostr.

## Next Steps

Next, we'll look at the server-side equivalent of the proxy:

- **[Gateway](/overview)**
