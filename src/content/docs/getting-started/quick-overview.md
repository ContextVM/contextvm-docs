---
title: Build with ContextVM
description: Choose the ContextVM CLI or an SDK to expose, discover, and call MCP servers over Nostr.
---

# Build with ContextVM

ContextVM carries Model Context Protocol (MCP) traffic over Nostr. An existing MCP server can be exposed without changing its tools, and any MCP host that supports stdio can reach a ContextVM server through a local proxy.

## Choose a starting point

| Goal                                                   | Start here                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Expose an existing stdio or Streamable HTTP MCP server | [Bridge an existing MCP server](/how-to/bridge-mcp-server)        |
| Connect an MCP host to a ContextVM server              | [Connect an MCP host with CVMI](/tutorials/connect-an-mcp-host)   |
| Build a TypeScript server or client                    | [TypeScript SDK overview](/reference/ts-sdk/quick-overview)       |
| Build a Rust server or client                          | [Rust SDK overview](/reference/rs-sdk/overview)                   |
| Charge for a tool call over Lightning                  | [Run a Lightning-paid tool](/how-to/payments/getting-started)     |
| Read the protocol                                      | [ContextVM draft specification](/reference/spec/ctxvm-draft-spec) |

## Main components

- **CVMI** is the command-line path for bridging an MCP server, calling a ContextVM server, or exposing a ContextVM server to an MCP host.
- **The TypeScript SDK** provides transports, signers, relay handlers, gateways, proxies, discovery, and CEP-8 payments.
- **The Rust SDK** provides native transports, gateway and proxy components, discovery, and language bindings.
- **ContextVM Enhancement Proposals (CEPs)** specify extensions such as public server announcements and payments.

## A first working path

Start a local filesystem MCP server behind a ContextVM gateway:

```bash
npx -y cvmi@0.4.1 serve -- npx -y @modelcontextprotocol/server-filesystem@2026.8.31 /tmp
```

The command prints the gateway public key. In another terminal, inspect the server through the same relay:

```bash
npx -y cvmi@0.4.1 call <server-public-key> --relays wss://relay.contextvm.org
```

Continue with [Bridge an existing MCP server](/how-to/bridge-mcp-server) for a verified tool call and troubleshooting.
