---
title: Tutorial Client-Server Communication
description: A step-by-step guide to setting up a basic MCP client and server that communicate directly over the Nostr network using the @contextvm/sdk.
---

# Tutorial: Client-Server Communication

This tutorial provides a complete, step-by-step guide to setting up a basic MCP client and server that communicate directly over the Nostr network using the `@contextvm/sdk`.

## Objective

We will build two separate scripts:

1.  `server.ts`: An MCP server that exposes a simple "echo" tool.
2.  `client.ts`: An MCP client that connects to the server, lists the available tools, and calls the "echo" tool.

## Prerequisites

- You have completed the [Quick Overview](/contextvm-docs/getting-started/quick-overview/).
- You have two Nostr private keys (one for the server, one for the client). You can generate new keys using various tools, or by running `nostr-tools` commands.

---

## 1. The Server (`server.ts`)

First, let's create the MCP server. This server will use the `NostrServerTransport` to listen for requests on the Nostr network.

Create a new file named `server.ts`:

```typescript
import { McpServer, Tool } from "@modelcontextprotocol/sdk/server";
import { NostrServerTransport } from "@ctxvm/sdk/transport";
import { PrivateKeySigner } from "@ctxvm/sdk/signer";
import { SimpleRelayPool } from "@ctxvm/sdk/relay";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";

// --- Configuration ---
// IMPORTANT: Replace with your own private key
const SERVER_PRIVATE_KEY_HEX =
  process.env.SERVER_PRIVATE_KEY || "your-32-byte-server-private-key-in-hex";
const RELAYS = ["wss://relay.damus.io", "wss://nos.lol"];

// --- Main Server Logic ---
async function main() {
  // 1. Setup Signer and Relay Pool
  const signer = new PrivateKeySigner(SERVER_PRIVATE_KEY_HEX);
  const relayPool = new SimpleRelayPool(RELAYS);
  const serverPubkey = await signer.getPublicKey();

  console.log(`Server Public Key: ${serverPubkey}`);
  console.log("Connecting to relays...");

  // 2. Create and Configure the MCP Server
  const mcpServer = new McpServer({
    name: "nostr-echo-server",
    version: "1.0.0",
  });

  // 3. Define a simple "echo" tool
  server.registerTool(
    "echo",
    {
      title: "Echo Tool",
      description: "Echoes back the provided message",
      inputSchema: { message: z.string() },
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `Tool echo: ${message}` }],
    }),
  );

  // 4. Configure the Nostr Server Transport
  const serverTransport = new NostrServerTransport({
    signer,
    relayHandler: relayPool,
    isPublicServer: true, // Announce this server on the Nostr network
    serverInfo: {
      name: "CTXVM Echo Server",
    },
  });

  // 5. Connect the server
  await mcpServer.connect(serverTransport);

  console.log("Server is running and listening for requests on Nostr...");
  console.log("Press Ctrl+C to exit.");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
```

### Running the Server

To run the server, execute the following command in your terminal. Be sure to replace the placeholder private key or set the `SERVER_PRIVATE_KEY` environment variable.

```bash
bun run server.ts
```

The server will start, print its public key, and wait for incoming client connections.

---

## 2. The Client (`client.ts`)

Next, let's create the client that will connect to our server.

Create a new file named `client.ts`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { NostrClientTransport } from "@ctxvm/sdk/transport";
import { PrivateKeySigner } from "@ctxvm/sdk/signer";
import { SimpleRelayPool } from "@ctxvm/sdk/relay";

// --- Configuration ---
// IMPORTANT: Replace with the server's public key from the server output
const SERVER_PUBKEY = "the-public-key-printed-by-server.ts";

// IMPORTANT: Replace with your own private key
const CLIENT_PRIVATE_KEY_HEX =
  process.env.CLIENT_PRIVATE_KEY || "your-32-byte-client-private-key-in-hex";
const RELAYS = ["wss://relay.damus.io", "wss://nos.lol"];

// --- Main Client Logic ---
async function main() {
  // 1. Setup Signer and Relay Pool
  const signer = new PrivateKeySigner(CLIENT_PRIVATE_KEY_HEX);
  const relayPool = new SimpleRelayPool(RELAYS);

  console.log("Connecting to relays...");

  // 2. Configure the Nostr Client Transport
  const clientTransport = new NostrClientTransport({
    signer,
    relayHandler: relayPool,
    serverPubkey: SERVER_PUBKEY,
  });

  // 3. Create and connect the MCP Client
  const mcpClient = new Client();
  await mcpClient.connect(clientTransport);

  console.log("Connected to server!");

  // 4. List the available tools
  console.log("\nListing available tools...");
  const tools = await mcpClient.listTools();
  console.log("Tools:", tools);

  // 5. Call the "echo" tool
  console.log('\nCalling the "echo" tool...');
  const echoResult = await mcpClient.callTool({
    name: "echo",
    arguments: { message: "Hello, Nostr!" },
  });
  console.log("Echo result:", echoResult);

  // 6. Close the connection
  await mcpClient.close();
  console.log("\nConnection closed.");
}

main().catch((error) => {
  console.error("Client failed:", error);
  process.exit(1);
});
```

### Running the Client

Open a **new terminal window** (leave the server running in the first one). Before running the client, make sure to update the `SERVER_PUBKEY` variable with the public key that your `server.ts` script printed to the console.

Then, run the client:

```bash
bun run client.ts
```

## Expected Output

If everything is configured correctly, you should see the following output in the client's terminal:

```
Connecting to relays...
Connected to server!

Listing available tools...
Tools: {
  tools: [
    {
      name: 'echo',
      description: 'Replies with the input it received.',
      inputSchema: { ... }
    }
  ]
}

Calling the "echo" tool...
Echo result: You said: Hello, Nostr!

Connection closed.
```

And that's it! You've successfully created an MCP client and server that communicate securely and decentrally over the Nostr network.
