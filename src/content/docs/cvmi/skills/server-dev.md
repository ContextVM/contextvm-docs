---
title: Server Development
description: Build MCP servers that expose capabilities over the Nostr network using ContextVM.
---

# Server Development

Build MCP servers that expose capabilities over Nostr using the [`@contextvm/sdk`](/ts-sdk/quick-overview).

## Quick Start

Create a basic ContextVM server:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NostrServerTransport } from "@contextvm/sdk";
import { PrivateKeySigner } from "@contextvm/sdk";
import { ApplesauceRelayPool } from "@contextvm/sdk";

const signer = new PrivateKeySigner(process.env.SERVER_PRIVATE_KEY!);
const relayPool = new ApplesauceRelayPool([
  "wss://relay.contextvm.org",
  "wss://cvm.otherstuff.ai",
]);

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

// Register tools
server.registerTool(
  "echo",
  { description: "Echo back the input" },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }],
  }),
);

const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  serverInfo: {
    name: "My ContextVM Server",
    website: "https://example.com",
  },
});

await server.connect(transport);
console.log("Server running on Nostr");
```

## NostrServerTransport Options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `signer` | `NostrSigner` | Required. Signs all Nostr events |
| `relayHandler` | `RelayHandler \| string[]` | Required. Relay connection manager |
| `serverInfo` | `ServerInfo` | Optional. Metadata for announcements |
| `isPublicServer` | `boolean` | Publish server announcements. Default: `false` |
| `allowedPublicKeys` | `string[]` | Whitelist client public keys |
| `excludedCapabilities` | `CapabilityExclusion[]` | Bypass whitelist for specific methods |
| `injectClientPubkey` | `boolean` | Inject client pubkey into `_meta`. Default: `false` |
| `encryptionMode` | `EncryptionMode` | `OPTIONAL`, `REQUIRED`, or `DISABLED` |

## Access Control

### Public Key Whitelisting

Restrict which clients can connect:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  allowedPublicKeys: ["client1-pubkey-hex", "client2-pubkey-hex"],
});
```

### Capability Exclusions

Allow specific operations from any client:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  allowedPublicKeys: ["trusted-client"],
  excludedCapabilities: [
    { method: "tools/list" }, // Anyone can list tools
    { method: "tools/call", name: "public_tool" }, // Specific tool is public
  ],
});
```

## Public Server Announcements

Enable discovery by publishing replaceable events:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  isPublicServer: true,
  serverInfo: {
    name: "Weather Service",
    about: "Get weather data worldwide",
    website: "https://weather.example.com",
  },
});
```

Publishes events on kinds 11316-11320 with your server's capabilities.

## Client Public Key Injection

Access the client's identity in your tools:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  injectClientPubkey: true,
});

// In your tool handler, access _meta.clientPubkey
server.registerTool("personalized", {...}, async (args, extra) => {
  const clientPubkey = extra._meta?.clientPubkey;
  // Use pubkey for personalization, rate limiting, etc.
});
```

## Server Template

For a complete starting point, see the [server template](https://github.com/contextvm/cvmi/blob/main/skills/server-dev/assets/server-template.ts) in the CVMI repository.

Basic structure:

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NostrServerTransport, PrivateKeySigner, ApplesauceRelayPool } from "@contextvm/sdk";

async function main() {
  // Initialize signer and relay pool
  const signer = new PrivateKeySigner(process.env.SERVER_PRIVATE_KEY!);
  const relayPool = new ApplesauceRelayPool([
    "wss://relay.contextvm.org",
  ]);

  // Create MCP server
  const server = new McpServer({ name: "my-server", version: "1.0.0" });

  // Register your tools
  server.registerTool("example", {
    description: "An example tool",
  }, async (args) => {
    return { content: [{ type: "text", text: "Result" }] };
  });

  // Create and connect transport
  const transport = new NostrServerTransport({
    signer,
    relayHandler: relayPool,
    isPublicServer: process.env.PUBLIC === "true",
    serverInfo: {
      name: "My Server",
      about: "Description of my server",
    },
  });

  await server.connect(transport);
  console.log("Server is running on Nostr");
}

main().catch(console.error);
```

## Debugging with MCP Inspector

Use the MCP Inspector to validate your MCP server behavior (tools/resources/prompts schemas, request/response shape) before exposing it via ContextVM.

From the MCP docs, the Inspector is typically run via `npx`:

```bash
npx @modelcontextprotocol/inspector <command>
```

Practical workflow for ContextVM:

1. Implement and test your server logic using a standard MCP transport (commonly STDIO) so it can be inspected.
2. Use the Inspector to iterate on tool schemas and error handling.
3. Once stable, swap the transport to `NostrServerTransport`.

## Gateway Pattern

If you have an existing MCP server that you want to expose over Nostr without modifying its code, use the **Gateway pattern** with [`NostrMCPGateway`](/ts-sdk/gateway/overview):

```typescript
import { NostrMCPGateway } from "@contextvm/sdk";

const gateway = new NostrMCPGateway({
  mcpClientTransport: new StdioClientTransport({
    command: "node",
    args: ["./existing-server.js"],
  }),
  nostrTransportOptions: {
    signer,
    relayHandler: relayPool,
    isPublicServer: true,
  },
});

await gateway.start();
```

Or use the CLI:

```bash
cvmi serve --server "node ./existing-server.js" --public
```

## Related Resources

- [TypeScript SDK Reference](/cvmi/skills/typescript-sdk) — SDK interfaces and patterns
- [Client Development](/cvmi/skills/client-dev) — Building clients
- [Deployment](/cvmi/skills/deployment) — Production deployment
- [NostrServerTransport](/ts-sdk/transports/nostr-server-transport) — Transport documentation
