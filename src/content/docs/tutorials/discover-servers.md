---
title: "Discover ContextVM Servers"
description: "How to find servers and their capabilities natively on the Nostr network."
---

# Tutorial: Discover ContextVM Servers

If a ContextVM server has [enabled public announcements](/tutorials/build-a-public-server), its capabilities are discoverable directly on the Nostr network without needing a centralized registry.

This tutorial covers the *consumer* side of CEP-6: querying relays to find active ContextVM servers and inspecting their available MCP tools.

## Prerequisites

- Node.js or Bun
- Access to Nostr relays

Note: You do not need a Nostr private key for read-only discovery operations.

---

## Step 1: Query for Server Announcements

Server announcements use event `kind: 11316`. The `content` field contains an MCP-compatible capabilities object, and the `tags` contain human-readable metadata.

Create a file named `discover.ts` and add the following:

```typescript
import { ApplesauceRelayPool } from "@contextvm/sdk";

const RELAYS = ["wss://relay.primal.net"];

async function main() {
  const pool = new ApplesauceRelayPool(RELAYS);
  await pool.connect();
  
  console.log("Searching for ContextVM servers...");

  // Subscribe to server announcements (kind 11316)
  const filters = [{ kinds: [11316], limit: 10 }];
  
  const serverEvents = await pool.querySync(filters);
  
  console.log(`Found ${serverEvents.length} servers.\n`);

  for (const event of serverEvents) {
    const pubkey = event.pubkey;
    const metadata = getMetadataFromTags(event.tags);
    
    console.log(`Server: ${metadata.name || "Unknown"}`);
    console.log(`Pubkey: ${pubkey}`);
    console.log(`About: ${metadata.about || "N/A"}\n`);
  }

  // Keep the script running to do Step 2
}

// Helper to extract common tags
function getMetadataFromTags(tags: string[][]) {
  const name = tags.find(t => t[0] === "name")?.[1];
  const about = tags.find(t => t[0] === "about")?.[1];
  return { name, about };
}

main().catch(console.error);
```

## Step 2: Fetch a Server's Tools

Once you know a server's public key, you can query specifically for its capabilities. Tools are published as `kind: 11317`.

Extend your script by adding this code inside the `main` loop, replacing the placeholder pubkey with one you discovered in Step 1:

```typescript
  // ... inside main()

  const targetPubkey = "<paste-a-pubkey-from-step-1>";
  console.log(`\nFetching tools for server ${targetPubkey}...`);

  const toolEvents = await pool.querySync([
    { kinds: [11317], authors: [targetPubkey], limit: 1 }
  ]);

  if (toolEvents.length > 0) {
    const toolsPayload = JSON.parse(toolEvents[0].content);
    console.log("Available tools:");
    for (const tool of toolsPayload.tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
  } else {
    console.log("This server has not announced any tools.");
  }
```

## Step 3: Connect to the Discovered Server

Once you have identified a server and verified it has the tools you want, you can establish a direct session. 

Because you discovered the `targetPubkey`, you pass it directly to the `NostrClientTransport`:

```typescript
import { NostrClientTransport, PrivateKeySigner } from "@contextvm/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// You need a signer to open a direct connection
const signer = new PrivateKeySigner("your-private-key-hex");

const transport = new NostrClientTransport({
  signer,
  relayHandler: pool,
  serverPubkey: targetPubkey,
});

const mcpClient = new Client({ name: "my-app", version: "1.0.0" });
await mcpClient.connect(transport);

// Now you can call the tools you discovered in Step 2!
```

## Rust Equivalent

If you are using the `rs-sdk`, you don't have to build the manual queries yourself. The SDK provides discovery helpers:

```rust
use contextvm_sdk::discovery;
use contextvm_sdk::relay::RelayPool;

let pool = RelayPool::new(signer).await?;
pool.connect(&["wss://relay.primal.net".to_string()]).await?;

let servers = discovery::discover_servers(pool.client(), &relays).await?;

for server in &servers {
    println!("Found server: {:?}", server.server_info.name);
    
    // Fetch specific tools for this server
    let tools = discovery::discover_tools(pool.client(), &server.pubkey_parsed, &relays).await?;
    println!("Tools exposed: {}", tools.len());
}
```

## Further Reading

- [CEP-17 Relay Discovery](/reference/ceps/cep-17): Learn how to discover *which relays* a server uses, so you don't have to hardcode them.
- [CEP-35 Stateless Discovery](/reference/ceps/informational/cep-35): Learn how clients can learn server capabilities rapidly without fetching public announcements.
