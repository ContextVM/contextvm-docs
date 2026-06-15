---
title: "Build a Public Server"
description: "Learn how to make a ContextVM server discoverable using CEP-6 public announcements"
---

# Tutorial: Build a Public Server

This tutorial shows how to make a ContextVM server discoverable via CEP-6 public announcements. By announcing your server, any client on the Nostr network can find it, learn about its capabilities, and connect to it.

## What you'll build

You will create a minimal ContextVM server that:
1. Exposes an MCP tool
2. Connects to Nostr relays
3. Publishes its metadata and capabilities (CEP-6 announcements)

## Prerequisites

- Node.js or Bun
- A Nostr private key (in hex format)
- Access to Nostr relays (e.g., `wss://relay.primal.net`)
- You have completed the [Client-Server Communication](/tutorials/client-server-communication) tutorial.

---

## Step 1: Create a basic MCP server

First, create a basic MCP server. We will use the `@modelcontextprotocol/sdk` and `@contextvm/sdk`.

Create a file named `public-server.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NostrServerTransport, PrivateKeySigner, ApplesauceRelayPool } from "@contextvm/sdk";
import { z } from "zod";

// Configuration
const SERVER_PRIVATE_KEY_HEX = process.env.SERVER_PRIVATE_KEY || "your-32-byte-hex-key";
const RELAYS = ["wss://relay.primal.net"];

async function main() {
  const signer = new PrivateKeySigner(SERVER_PRIVATE_KEY_HEX);
  const relayPool = new ApplesauceRelayPool(RELAYS);
  
  // Create the MCP Server
  const mcpServer = new McpServer({
    name: "my-public-server",
    version: "1.0.0",
  });

  // Add a simple tool
  mcpServer.registerTool(
    "greet",
    {
      description: "Greets a user by name",
      inputSchema: { name: z.string() },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    }),
  );

  // Transport will be configured in Step 2...
}

main().catch(console.error);
```

## Step 2: Enable public announcements

To make the server public, configure the `NostrServerTransport` with `isAnnouncedServer: true`.

When `isAnnouncedServer` is `true`, the transport automatically publishes NIP-01 replaceable events (kinds 11316-11320) containing the server's metadata and its available tools, resources, and prompts.

Add the transport configuration to your script:

```typescript
  // ... inside main()

  const serverTransport = new NostrServerTransport({
    signer,
    relayHandler: relayPool,
    isAnnouncedServer: true, // This enables CEP-6 announcements
    serverInfo: {
      name: "Greeting Server",
      about: "A simple server that provides greeting tools.",
      picture: "https://example.com/avatar.png", // Optional
      website: "https://contextvm.org",         // Optional
    },
  });

  await mcpServer.connect(serverTransport);
  console.log(`Server running. Public key: ${await signer.getPublicKey()}`);
```

## Step 3: Run and verify

Run your server:

```bash
bun run public-server.ts
```

When the transport starts, it performs a simulated MCP request to itself (calling `tools/list`, `resources/list`, etc.) and publishes the results to the relays.

You can verify your server is discoverable by querying the relays for a `kind: 11316` event authored by your server's public key. You can use any Nostr client or the ContextVM discovery helpers.

```bash
# Example using nak (the standard Nostr CLI)
nak req -k 11316 -a <your-server-pubkey> wss://relay.primal.net
```

## Step 4: Remove announcements

If you take your server offline permanently, you should clean up its public announcements. ContextVM uses NIP-09 deletion events (kind 5) to achieve this.

You can delete announcements using a utility script or by calling an exposed transport method (if your SDK implementation provides a cleanup function). The `rs-sdk` natively provides a helper for this via its announcement module.

## Next Steps

- Learn how clients find your server in the [Discover ContextVM Servers](/tutorials/discover-servers) tutorial.
- Read the formal [CEP-6 Specification](/reference/ceps/cep-6).
- Use [CEP-15 Common Tool Schemas](/reference/ceps/cep-15) to make your tools semantically interoperable.
