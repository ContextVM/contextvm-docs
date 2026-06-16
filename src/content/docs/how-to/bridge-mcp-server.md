---
title: "Bridge an Existing MCP Server"
description: "How to expose an existing local or HTTP MCP server to the Nostr network using the Gateway."
---

# How-to: Bridge an Existing MCP Server

If you already have a working MCP server built with another framework (like the official Python or TypeScript SDKs), you do not need to rewrite it to support ContextVM natively.

Instead, you can use the `NostrMCPGateway`. The gateway acts as a bridge: it connects to your existing MCP server locally and exposes it over the Nostr network to ContextVM clients.

## Step 1: Identify your MCP Server Transport

Determine how your existing MCP server runs:
- **Stdio**: It runs as a local command-line process (e.g., `python server.py` or `node server.js`).
- **HTTP/SSE**: It runs as a web server exposing an SSE endpoint.

## Step 2: Set up the Gateway Script

Create a new file called `gateway.ts`. You will need to install the ContextVM SDK and the official MCP SDK for the client transports.

```bash
npm install @contextvm/sdk @modelcontextprotocol/sdk
```

Add the following code to `gateway.ts`, adapting the transport to match your server type.

### Example for a Stdio Server

```typescript
import { NostrMCPGateway, PrivateKeySigner, ApplesauceRelayPool } from "@contextvm/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const signer = new PrivateKeySigner("your-gateway-private-key-hex");
  const pool = new ApplesauceRelayPool(["wss://relay.primal.net"]);

  // 1. Define how to reach your existing server
  const localMcpTransport = new StdioClientTransport({
    command: "python", // or "node", "bun", etc.
    args: ["path/to/your/existing/server.py"],
  });

  // 2. Configure the gateway
  const gateway = new NostrMCPGateway({
    // The connection to your local server
    mcpClientTransport: localMcpTransport,
    
    // The connection to the Nostr network
    nostrTransportOptions: {
      signer,
      relayHandler: pool,
      // Optional: allow any Nostr client to find your bridged server
      isAnnouncedServer: true, 
      serverInfo: {
        name: "Bridged Python Server"
      }
    },
  });

  // 3. Start bridging!
  await gateway.start();
  console.log(`Gateway running! Nostr Pubkey: ${await signer.getPublicKey()}`);
}

main().catch(console.error);
```

## Step 3: Run the Gateway

Execute your gateway script:

```bash
bun run gateway.ts
```

Your existing MCP server is now accessible securely over the Nostr network. Any ContextVM client can connect to the printed Nostr Pubkey and interact with your server as if it were a native ContextVM server.

## Advanced: Per-Client Isolation

In the basic example above, the Gateway uses **Single-Client Mode**. This means if 10 Nostr clients connect to your Gateway, all their requests are funneled through a *single* `StdioClientTransport` instance to your backend server.

If your backend server stores state per-connection, or if you are bridging to an HTTP SSE server that expects each client to have its own session, you should use **Per-Client Mode**.

Instead of providing a single `mcpClientTransport`, provide a factory function using `createMcpClientTransport`:

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const gateway = new NostrMCPGateway({
  // Create a fresh transport for every unique Nostr client pubkey
  createMcpClientTransport: ({ clientPubkey }) => {
    console.log(`New Nostr client connected: ${clientPubkey}`);
    return new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp"));
  },
  
  // Optional: Prevent memory leaks from stale sessions
  maxClientTransports: 500, 
  
  nostrTransportOptions: {
    signer,
    relayHandler: pool,
  },
});
```

With this configuration, the Gateway automatically tracks Nostr clients. When a new Nostr client initializes a connection, the Gateway spins up a dedicated connection to your backend server specifically for that client. When `maxClientTransports` is reached, it safely evicts the oldest inactive session.

## Further Reading

- For detailed configuration options, see the [Gateway Reference](/reference/ts-sdk/gateway/overview).
