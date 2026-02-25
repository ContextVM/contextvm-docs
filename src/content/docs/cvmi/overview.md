---
title: CVMI Overview
description: An overview of CVMI (ContextVM Interface), the CLI tool for navigating and using the ContextVM protocol.
---

# CVMI Overview

**ContextVM Interface (CVMI)** is a CLI tool that allows you to navigate and use the ContextVM protocol. It provides a comprehensive set of tools and skills to help you interact with and implement the protocol.

> **Note:** This project is a fork of the [`skills`](https://github.com/vercel-labs/skills) CLI by Vercel Labs.

## What is CVMI?

CVMI serves as your Swiss army knife for working with ContextVM. It simplifies common tasks and provides a unified interface for:

- **Managing skills** - Install and organize ContextVM skills that help you build and interact with the protocol
- **Running gateways** - Expose MCP servers to the Nostr network
- **Using proxies** - Connect to remote MCP servers through Nostr as if they were local

## Key Features

### Swiss Army Knife for CVM

CVMI consolidates multiple tools into a single CLI interface, making it easy to:
- Install skills interactively or programmatically
- Expose local or remote MCP servers as Nostr gateways
- Use remote Nostr-based MCP servers through a local stdio proxy

### Skills System

The skills system allows you to install documentation and code templates directly into your project:
- Browse available skills interactively
- Install specific skills on demand
- Keep your skills up to date

### Gateway Mode (`cvmi serve`)

Expose any MCP server to the Nostr network:
- Works with local stdio-based MCP servers
- Supports remote Streamable HTTP MCP servers
- Automatic key generation and encryption handling

### Proxy Mode (`cvmi use`)

Connect to remote Nostr-based MCP servers as if they were local:
- Bridges Nostr transport to stdio for clients that don't natively support Nostr
- Perfect for integrating with existing MCP clients

## Use Cases

### When to Use CVMI

- **Developing with ContextVM** - Install skills to learn best practices and access reference implementations
- **Exposing MCP Servers** - Use `cvmi serve` to make your MCP server available over Nostr
- **Connecting to Remote Servers** - Use `cvmi use` to connect to Nostr-based MCP servers from standard MCP clients
- **Protocol Exploration** - Quickly experiment with ContextVM capabilities without writing code

## Relationship to Other Tools

### CVMI vs. TypeScript SDK

| CVMI | TypeScript SDK |
|------|----------------|
| CLI tool for quick tasks | Library for building applications |
| No code required | Requires JavaScript/TypeScript development |
| Skills management | Core protocol implementation |
| Gateway/proxy commands | Transport implementations |

### CVMI vs. Specification

- **CVMI** is a practical tool that implements the ContextVM specification
- The **Specification** defines the protocol standards and CEPs (Context Enhancement Proposals)
- CVMI helps you work with the specification without deep protocol knowledge

## Next Steps

- [Install CVMI](/cvmi/installation) - Get started with CVMI
- [Commands Reference](/cvmi/commands) - Learn about available commands
- [Configuration](/cvmi/configuration) - Configure CVMI for your needs
