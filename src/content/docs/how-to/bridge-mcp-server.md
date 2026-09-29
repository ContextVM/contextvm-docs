---
title: Expose an MCP Server over Nostr
description: Bridge a stdio or Streamable HTTP MCP server with CVMI, verify a tool call, and use the SDK for custom gateway control.
---

# Expose an MCP server over Nostr

CVMI can put an existing MCP server behind a ContextVM gateway. The MCP server keeps its current tools and transport; CVMI handles the Nostr connection.

## Prerequisites and tested versions

This guide was tested with:

- Node.js 20.20.2
- CVMI 0.4.1
- `@modelcontextprotocol/server-filesystem` 2026.8.31
- `@contextvm/sdk` 0.14.3 and `@contextvm/mcp-sdk` 1.30.0 for the custom SDK example
- `wss://relay.contextvm.org`

The CLI path is the shortest setup. Use the SDK path only when you need to construct transports or gateway policy in code.

## Bridge a stdio server with CVMI

Create a directory and a file that the example server can read:

```bash
mkdir -p /tmp/contextvm-mcp-demo
printf 'ContextVM bridge verified.\n' > /tmp/contextvm-mcp-demo/hello.txt
```

Start the filesystem server through CVMI:

```bash
npx -y cvmi@0.4.1 serve -- \
  npx -y @modelcontextprotocol/server-filesystem@2026.8.31 \
  /tmp/contextvm-mcp-demo
```

Keep this process running. Its output includes these lines:

```text
Generated new private key
Public key: <64-character-hex-key>
Secure MCP Filesystem Server running on stdio
Gateway started. Press Ctrl+C to stop.
```

CVMI generates a gateway key when none is configured. Copy the public key; clients use it as the server identity.

In a second terminal, list the bridged tools:

```bash
npx -y cvmi@0.4.1 call <server-public-key> \
  --relays wss://relay.contextvm.org
```

Then call the filesystem tool:

```bash
npx -y cvmi@0.4.1 call <server-public-key> read_text_file \
  path=/tmp/contextvm-mcp-demo/hello.txt \
  --relays wss://relay.contextvm.org
```

Expected result:

```text
content: ContextVM bridge verified.
```

The `--` before the MCP server command is significant: CVMI options go before it, and the child command and its arguments go after it.

## Bridge a Streamable HTTP server

Pass the MCP endpoint instead of a child command:

```bash
npx -y cvmi@0.4.1 serve https://example.com/mcp
```

Do not add child-process arguments after an HTTP URL. CVMI opens a separate MCP transport for each ContextVM client because Streamable HTTP sessions maintain their own session state.

## Keep a stable gateway identity

The generated key changes on every start. Persist it when clients need a stable server identity:

```bash
npx -y cvmi@0.4.1 serve --persist-private-key -- \
  npx -y @modelcontextprotocol/server-filesystem@2026.8.31 \
  /tmp/contextvm-mcp-demo
```

This writes `CVMI_SERVE_PRIVATE_KEY` to `.env` in the working directory. Treat that value as a secret and do not commit it.

## Troubleshooting

- **The client times out:** confirm both commands use `wss://relay.contextvm.org`, the gateway process is still running, and the server key was copied without spaces.
- **The MCP child exits:** run the child command by itself first. CVMI passes the executable and arguments directly; shell aliases and shell pipelines are not expanded.
- **A file call is denied:** use an absolute path inside one of the directories passed to the filesystem server.
- **An MCP host reports `Unsupported payment_interaction mode: explicit_gating`:** CVMI 0.4.1 requests explicit gating from `cvmi use` by default. Add `--payment-mode transparent` when connecting to a free or transparent-only server.
- **The identity changes after restart:** set `CVMI_SERVE_PRIVATE_KEY` or use `--persist-private-key` once.

## Custom gateway with the SDK

Use `NostrMCPGateway` when the application must build the MCP transport or gateway settings itself.

```bash
bun add @contextvm/sdk@0.14.3 @contextvm/mcp-sdk@1.30.0
```

```ts
import { StdioClientTransport } from "@contextvm/mcp-sdk/client/stdio";
import {
  ApplesauceRelayPool,
  NostrMCPGateway,
  PrivateKeySigner,
} from "@contextvm/sdk";

const privateKey = process.env.CONTEXTVM_GATEWAY_PRIVATE_KEY;
if (!privateKey) throw new Error("Set CONTEXTVM_GATEWAY_PRIVATE_KEY");

const gateway = new NostrMCPGateway({
  mcpClientTransport: new StdioClientTransport({
    command: "python",
    args: ["server.py"],
  }),
  nostrTransportOptions: {
    signer: new PrivateKeySigner(privateKey),
    relayHandler: new ApplesauceRelayPool(["wss://relay.contextvm.org"]),
    isPublicServer: true,
    serverInfo: { name: "Bridged MCP server" },
  },
});

await gateway.start();
console.log("Gateway started");
```

For an HTTP backend, provide `createMcpClientTransport` and return a new `StreamableHTTPClientTransport` for each client. See the [gateway reference](/reference/ts-sdk/gateway/overview) for the option contract.
