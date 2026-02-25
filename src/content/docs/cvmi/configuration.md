---
title: Configuration
description: Configure CVMI through config files and environment variables.
---

# Configuration

CVMI can be configured through configuration files and environment variables. This allows you to set default values for common options and customize behavior for different environments.

## Config File Locations and Priority

Configuration is stored in JSON format. CVMI looks for configuration in the following order (highest priority first):

1. **CLI flags** - Command-line arguments override all other settings
2. **Custom config** - `--config <path>` specifies a custom configuration file
3. **Project-level** - `./.cvmi.json` in the current directory
4. **Global** - `~/.cvmi/config.json` in your home directory
5. **Environment variables** - Lowest priority, used as fallback

### Global Config Path

The global configuration is stored at:

```
~/.cvmi/config.json
```

This is separate from `~/.agents/` which is used for storing installed skills.

## Environment Variables

### Nostr MCP Environment Variables

CVMI uses the following environment variable prefixes for configuration:

| Prefix | Description |
|--------|-------------|
| `CVMI_SERVE_*` | Settings for the `serve` command (gateway) |
| `CVMI_GATEWAY_*` | Legacy alias for `CVMI_SERVE_*` |
| `CVMI_USE_*` | Settings for the `use` command (proxy) |
| `CVMI_PROXY_*` | Legacy alias for `CVMI_USE_*` |

### Additional Serve Environment Variables

| Variable | Description |
|----------|-------------|
| `CVMI_SERVE_URL` / `CVMI_GATEWAY_URL` | Set the remote Streamable HTTP MCP server URL |

### Logging Environment Variables

The underlying `@contextvm/sdk` uses these environment variables to control logging:

| Variable | Values | Description |
|----------|--------|-------------|
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error`, `silent` | Minimum log level to output (default: `info`) |
| `LOG_DESTINATION` | `stderr`, `stdout`, `file` | Where to write logs (default: `stderr`) |
| `LOG_FILE` | path string | Path to log file (used when `LOG_DESTINATION=file`) |
| `LOG_ENABLED` | `true`, `false` | Disable all logging with `false` (default: `true`) |

## Example Config Files

### Global Config (`~/.cvmi/config.json`)

```json
{
  "serve": {
    "url": "https://my.mcp.com/mcp",
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem", "."],
    "privateKey": "nsec1...",
    "relays": ["wss://relay.damus.io"],
    "public": false,
    "encryption": "optional"
  },
  "use": {
    "privateKey": "nsec1...",
    "relays": ["wss://relay.damus.io"],
    "serverPubkey": "npub1...",
    "encryption": "optional"
  }
}
```

**Note:** For `serve`, configure either `serve.url` (remote Streamable HTTP MCP server) **or** `serve.command`/`serve.args` (spawn local stdio MCP server), not both.

### Project-Level Config (`./.cvmi.json`)

```json
{
  "serve": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem", "./data"],
    "relays": ["wss://relay.damus.io", "wss://relay.nostr.band"],
    "encryption": "required"
  }
}
```

## About Quoting Commands

When using `cvmi serve`, the MCP server is spawned directly (no shell). It's recommended to pass the command and its arguments as separate tokens after the `--` separator:

```bash
# Recommended - separate tokens
npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

If you accidentally pass a full command as a single quoted string, CVMI will automatically split it into an executable and arguments for you:

```bash
# Also works - CVMI auto-splits
npx cvmi serve -- "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

## Passing Environment Variables to Spawned MCP Server

Use the `--env` or `-e` flag (repeatable) to pass environment variables to the spawned MCP server:

```bash
npx cvmi serve -e LOG_LEVEL=debug -e NODE_ENV=production -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

You can also set environment variables in the configuration file under `serve.env`:

```json
{
  "serve": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem", "/tmp"],
    "env": {
      "LOG_LEVEL": "debug",
      "NODE_ENV": "production"
    }
  }
}
```

## Key Formats

CVMI accepts keys in multiple formats:

- **Hex format** - With or without `0x` prefix (e.g., `a1b2c3...` or `0xa1b2c3...`)
- **NIP-19 bech32 format** - For private keys (`nsec1...`) and public keys (`npub1...`)

If no private key is provided, CVMI auto-generates one for you.

## Examples

### Run serve with debug logging to a file

```bash
LOG_LEVEL=debug LOG_DESTINATION=file LOG_FILE=./cvmi.log npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

### Run use with only warnings and errors

```bash
LOG_LEVEL=warn npx cvmi use npub1q...
```

### Use custom config file

```bash
npx cvmi serve --config ./my-config.json -- npx -y @modelcontextprotocol/server-filesystem /tmp
```
