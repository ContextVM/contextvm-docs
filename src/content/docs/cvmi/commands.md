---
title: Commands
description: Reference guide for all CVMI commands including add, serve, use, and future roadmap commands.
---

# Commands

CVMI provides a set of commands for managing skills, running gateways, and connecting to remote servers.

## `cvmi add`

Install ContextVM skills. Skills provide documentation, templates, and reference implementations to help you work with the ContextVM protocol.

### Usage

```bash
npx cvmi add [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--skill <name>` | Install a specific skill by name |

### Examples

**Interactive installation** (browse and select skills):

```bash
npx cvmi add
```

**Install a specific skill**:

```bash
npx cvmi add --skill overview
npx cvmi add --skill typescript-sdk
npx cvmi add --skill server-dev
npx cvmi add --skill client-dev
```

**Install multiple skills**:

```bash
npx cvmi add --skill overview --skill payments --skill deployment
```

## `cvmi serve`

Expose an MCP server as a gateway on the Nostr network. This allows Nostr clients to connect to your MCP server.

### Usage

```bash
npx cvmi serve [options] -- <command> [args...]
```

### Options

| Option | Description |
|--------|-------------|
| `-e, --env <key=value>` | Pass environment variables to the spawned MCP server (repeatable) |
| `--config <path>` | Use a custom configuration file |

### Examples

**Serve a local stdio MCP server**:

```bash
npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

**Serve with environment variables**:

```bash
npx cvmi serve -e LOG_LEVEL=debug -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

**Serve a remote HTTP MCP server** (configured via config file or environment):

```bash
npx cvmi serve
```

**With debug logging**:

```bash
LOG_LEVEL=debug npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

### About Quoting Commands

`cvmi serve` spawns the MCP server directly (no shell). Prefer passing the command and its arguments as separate tokens:

```bash
# Correct - separate tokens
npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp

# Also works - CVMI will auto-split for you
npx cvmi serve -- "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

## `cvmi use`

Use a server from Nostr as a local stdio proxy. This allows standard MCP clients to connect to Nostr-based MCP servers.

### Usage

```bash
npx cvmi use <serverPubkey> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `serverPubkey` | The Nostr public key of the server (npub1... or hex) |

### Examples

**Connect to a server by public key**:

```bash
npx cvmi use npub1q...
```

**Connect with specific logging**:

```bash
LOG_LEVEL=warn npx cvmi use npub1q...
```

### Use Case

The `use` command is particularly useful when:
- You have an MCP client that only supports stdio transport
- You want to connect to a remote server published on Nostr
- You're testing or debugging Nostr-based MCP servers

## Roadmap

The following commands are planned for future releases:

### `cvmi cn` (Coming Soon)

Compile a server to code (ctxcn). This will allow you to compile ContextVM configurations into deployable code bundles.

### `cvmi call` (Coming Soon)

Call methods from a server directly from the command line. Useful for testing and scripting server interactions.

### `cvmi inspect` (Coming Soon)

Inspect server schema and capabilities. Get detailed information about available tools, resources, and methods on a server.

## Common Options

All commands support these global options:

| Option | Description |
|--------|-------------|
| `--config <path>` | Specify a custom configuration file |
| `--help` | Display help for the command |
| `--version` | Display version information |

## Environment Variables

See the [Configuration](/cvmi/configuration) page for details on environment variables that affect command behavior.
