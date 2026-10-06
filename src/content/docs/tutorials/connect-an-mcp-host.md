---
title: Connect an MCP Host with CVMI
description: Run a ContextVM server as a local stdio MCP process, list its tools, and complete a tool call from an MCP host.
---

# Connect an MCP host with CVMI

`cvmi use` connects to a ContextVM server over Nostr and exposes it locally over stdio. An MCP host starts CVMI as its server process and uses ordinary MCP requests.

## Prerequisites and tested versions

This tutorial was tested with:

- Node.js 20.20.2
- CVMI 0.4.1
- `@modelcontextprotocol/sdk` 1.30.0
- the filesystem gateway from [Expose an MCP server over Nostr](/how-to/bridge-mcp-server)
- `wss://relay.contextvm.org`

Complete the bridge guide first and leave its gateway process running. You need the 64-character server public key printed by `cvmi serve`.

## Create a minimal MCP host

Create a project and install the MCP SDK:

```bash
mkdir contextvm-mcp-host
cd contextvm-mcp-host
npm init -y
npm install @modelcontextprotocol/sdk@1.30.0
```

Create `host.mjs`:

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverPublicKey = process.env.CONTEXTVM_SERVER;
if (!serverPublicKey) throw new Error("Set CONTEXTVM_SERVER");

const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "-y",
    "cvmi@0.4.1",
    "use",
    serverPublicKey,
    "--relays",
    "wss://relay.contextvm.org",
    "--payment-mode",
    "transparent",
  ],
});

const client = new Client({
  name: "contextvm-host-example",
  version: "1.0.0",
});

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  if (!tools.some((tool) => tool.name === "read_text_file")) {
    throw new Error("The server did not expose read_text_file");
  }

  const result = await client.callTool({
    name: "read_text_file",
    arguments: { path: "/tmp/contextvm-mcp-demo/hello.txt" },
  });

  const content = result.content.find((item) => item.type === "text");
  console.log(content?.text);
} finally {
  await client.close();
}
```

Run the host with the server public key from the gateway terminal:

```bash
CONTEXTVM_SERVER=<server-public-key> node host.mjs
```

The final line confirms the tool call crossed stdio, Nostr, and the bridged MCP server:

```text
ContextVM bridge verified.
```

## Configure another stdio MCP host

Hosts that accept an MCP server JSON entry use the same command and arguments:

```json
{
  "mcpServers": {
    "contextvm-files": {
      "command": "npx",
      "args": [
        "-y",
        "cvmi@0.4.1",
        "use",
        "<server-public-key>",
        "--relays",
        "wss://relay.contextvm.org",
        "--payment-mode",
        "transparent"
      ]
    }
  }
}
```

Restart the host after changing its configuration. It should expose the same `read_text_file` tool. Use an absolute `npx` path if the host starts with a restricted `PATH`.

For a server that supports CEP-8 explicit gating, replace `transparent` with `explicit_gating`. The MCP host must then handle the `-32042` payment-required error and retry after payment.
