---
title: Commands
description: Reference guide for CVMI commands including add, serve, use, and cn.
---

# Commands

CVMI provides commands for managing skills, running gateways, connecting to remote servers, and generating typed clients from ContextVM servers.

## `cvmi add`

Install ContextVM skills. Skills provide documentation, templates, and reference implementations to help you work with the ContextVM protocol.

### Usage

```bash
npx cvmi add [options]
```

### Options

| Option           | Description                      |
| ---------------- | -------------------------------- |
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

| Option                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `-e, --env <key=value>` | Pass environment variables to the spawned MCP server (repeatable) |
| `--config <path>`       | Use a custom configuration file                                   |

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

| Argument       | Description                                          |
| -------------- | ---------------------------------------------------- |
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

## `cvmi cn`

Generate type-safe TypeScript clients from a ContextVM server. The `cn` command group is useful when you want an application-facing client instead of using the gateway or stdio proxy flows.

### Usage

```bash
npx cvmi cn <command> [options]
```

### Subcommands

| Subcommand         | Description |
| ------------------ | ----------- |
| `init`             | Initialize `cn` in the current project |
| `add <pubkey>`     | Connect to a server and generate a client file |
| `update [pubkey]`  | Refresh one generated client or all added clients |

### `cvmi cn init`

Set up a project for generated ContextVM clients.

```bash
npx cvmi cn init
```

This command:

- verifies that you are inside a valid project directory
- creates a project-level `.cvmi-cn.json` file for client generation settings
- creates the configured output directory for generated clients
- warns if the required ContextVM SDK dependency is not installed

### `cvmi cn add <pubkey>`

Connect to a ContextVM server by public key, inspect its tools, and generate a typed client.

```bash
npx cvmi cn add <serverPubkey>
```

During generation, CVMI lets you:

- review discovered server metadata and tools
- override the default generated client class name
- print the generated code without saving it
- save the generated file into the configured source directory

### `cvmi cn update [pubkey]`

Refresh a previously added client.

```bash
npx cvmi cn update
npx cvmi cn update <serverPubkey>
```

When no pubkey is provided, CVMI prompts you to update one generated client or all configured clients.

### Example workflow

```bash
# initialize the current project
npx cvmi cn init

# generate a typed client for a server
npx cvmi cn add npub1...

# later, refresh all generated clients
npx cvmi cn update
```

## Roadmap

The following commands are planned for future releases:

## `cvmi call`

Inspect a remote ContextVM server or invoke one of its tools directly from the terminal.

### Usage

```bash
npx cvmi call <server>
npx cvmi call <server> <tool> [key=value ...] [options]
```

### Arguments

| Argument | Description |
| -------- | ----------- |
| `server` | Server alias, `npub1...`, or hex public key |
| `tool`   | Optional tool name to invoke |

### What `cvmi call` does

- lists a server's available tools when only the server is provided
- shows per-tool input information to help with invocation
- invokes a tool directly from the command line using `key=value` arguments
- supports fast inspection and scripting without generating a client first

### Examples

```bash
# inspect a server and list its tools
npx cvmi call npub1...

# invoke a tool with named arguments
npx cvmi call npub1... search query="weather in madeira"

# use a configured alias instead of a raw pubkey
npx cvmi call weather search city=Funchal
```

### When to use `cvmi call`

`cvmi call` is a good fit when you want to:

- quickly inspect a remote server's capabilities
- manually test a tool without writing app code
- script one-off calls from the shell
- validate a server before generating a reusable client with `cvmi cn`

### `cvmi inspect` (Coming Soon)

Inspect server schema and capabilities. Get detailed information about available tools, resources, and methods on a server.

## Common Options

All commands support these global options:

| Option            | Description                         |
| ----------------- | ----------------------------------- |
| `--config <path>` | Specify a custom configuration file |
| `--help`          | Display help for the command        |
| `--version`       | Display version information         |

## Environment Variables

See the [Configuration](/cvmi/configuration) page for details on environment variables that affect command behavior.
