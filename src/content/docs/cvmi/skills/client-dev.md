---
title: Client Development
description: Build MCP clients that connect to ContextVM servers over the Nostr network.
---

# Client Development

Build MCP clients that connect to ContextVM servers over the Nostr network.

## Quick Start

Connect to a ContextVM server:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import {
  NostrClientTransport,
  PrivateKeySigner,
  ApplesauceRelayPool,
  EncryptionMode,
} from "@contextvm/sdk";

const signer = new PrivateKeySigner(process.env.CLIENT_PRIVATE_KEY!);
const relayPool = new ApplesauceRelayPool([
  "wss://relay.contextvm.org",
  "wss://cvm.otherstuff.ai",
]);

const SERVER_PUBKEY = "server-public-key-hex";

const transport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: SERVER_PUBKEY,
  encryptionMode: EncryptionMode.OPTIONAL,
});

const client = new Client({
  name: "my-client",
  version: "1.0.0",
});

await client.connect(transport);

// Use the client
const tools = await client.listTools();
const result = await client.callTool({
  name: "echo",
  arguments: { message: "Hello" },
});
```

## Server Discovery

### Direct Connection (Known Pubkey)

Connect when you know the server's public key:

```typescript
const transport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: "known-server-pubkey",
});
```

### Discovery via Announcements

Find servers broadcasting on the network:

```typescript
import { CTXVM_MESSAGES_KIND, SERVER_ANNOUNCEMENT_KIND } from "@contextvm/sdk";

// Query relays for server announcements
await relayPool.subscribe([{ kinds: [SERVER_ANNOUNCEMENT_KIND] }], (event) => {
  const serverInfo = JSON.parse(event.content);
  console.log(`Found server: ${serverInfo.serverInfo.name}`);
  console.log(`Pubkey: ${event.pubkey}`);
});
```

## NostrClientTransport Options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `signer` | `NostrSigner` | Required. Signs all Nostr events |
| `relayHandler` | `RelayHandler \| string[]` | Required. Relay connection manager |
| `serverPubkey` | `string` | Required. Target server's public key |
| `encryptionMode` | `EncryptionMode` | `OPTIONAL`, `REQUIRED`, or `DISABLED` |
| `isStateless` | `boolean` | Skip initialization handshake. Default: `false` |
| `logLevel` | `LogLevel` | Logging verbosity |

## Stateless Mode

Skip the initialization handshake for faster connections:

```typescript
const transport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: SERVER_PUBKEY,
  isStateless: true, // Skip initialize roundtrip
});
```

## Proxy Pattern

Use [`NostrMCPProxy`](/ts-sdk/proxy/overview) to connect existing MCP clients to ContextVM servers:

```typescript
import { NostrMCPProxy } from "@contextvm/sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const proxy = new NostrMCPProxy({
  // Local transport for existing client to connect to
  mcpHostTransport: new StdioServerTransport(),

  // Remote server connection
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
    serverPubkey: SERVER_PUBKEY,
  },
});

await proxy.start();
```

This allows any standard MCP client to use ContextVM servers without native support.

Or use the CLI:

```bash
cvmi use --server-pubkey "npub1..."
```

## Encryption

Control encryption behavior:

```typescript
// Require encrypted connections only
encryptionMode: EncryptionMode.REQUIRED;

// Use encryption if server supports it (default)
encryptionMode: EncryptionMode.OPTIONAL;

// Never use encryption
encryptionMode: EncryptionMode.DISABLED;
```

## Client Template

For a complete starting point, see the [client template](https://github.com/contextvm/cvmi/blob/main/skills/client-dev/assets/client-template.ts) in the CVMI repository.

Basic structure:

```typescript
#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client";
import { NostrClientTransport, PrivateKeySigner, ApplesauceRelayPool } from "@contextvm/sdk";

async function main() {
  // Initialize signer and relay pool
  const signer = new PrivateKeySigner(process.env.CLIENT_PRIVATE_KEY!);
  const relayPool = new ApplesauceRelayPool([
    "wss://relay.contextvm.org",
  ]);

  // Server to connect to
  const serverPubkey = process.env.SERVER_PUBKEY!;

  // Create transport and client
  const transport = new NostrClientTransport({
    signer,
    relayHandler: relayPool,
    serverPubkey,
  });

  const client = new Client({ name: "my-client", version: "1.0.0" });

  // Connect and use
  await client.connect(transport);
  
  const tools = await client.listTools();
  console.log("Available tools:", tools);
}

main().catch(console.error);
```

## Typed Client Generation (ctxcn)

If you are building a TypeScript app and want remote ContextVM tools to feel like local functions, use `ctxcn`.

High-level behavior:

- Connects to a ContextVM server
- Reads `tools/list` schemas
- Generates TypeScript client code into your repo (shadcn-style: you own the generated code)

Basic flow:

```bash
npx @contextvm/ctxcn init
npx @contextvm/ctxcn add <server-pubkey>
npx @contextvm/ctxcn update
```

Use this when:

- You want end-to-end type safety
- You want IDE autocomplete for server tools
- You want to avoid hand-writing tool interfaces

## Connection Patterns

### Persistent Connection

For long-running clients, maintain a persistent connection:

```typescript
const client = new Client({...});
await client.connect(transport);

// Use throughout application lifecycle
// Handle reconnections if needed
```

### One-Shot Requests

For simple scripts, use the client and disconnect:

```typescript
const client = new Client({...});
await client.connect(transport);

const result = await client.callTool({...});
console.log(result);

// Clean up
await client.disconnect();
```

## Related Resources

- [TypeScript SDK Reference](/cvmi/skills/typescript-sdk) — SDK interfaces and patterns
- [Server Development](/cvmi/skills/server-dev) — Building servers
- [NostrClientTransport](/ts-sdk/transports/nostr-client-transport) — Transport documentation
- [Proxy Overview](/ts-sdk/proxy/overview) — Proxy pattern details
