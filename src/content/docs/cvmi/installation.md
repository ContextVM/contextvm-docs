---
title: Installation
description: How to install and get started with CVMI (ContextVM Interface).
---

# Installation

CVMI is distributed as an NPM package and can be run directly using `npx` without requiring a global installation.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- A package manager (npm, yarn, pnpm, or bun)

## Installing via npx (Recommended)

The easiest way to use CVMI is with `npx`, which downloads and runs the latest version on demand:

```bash
# Install ContextVM skills interactively
npx cvmi add

# Install a specific skill
npx cvmi add --skill overview
```

Using `npx` ensures you always have the latest version without managing global installations.

## Quick Start Examples

### Install Skills

Browse and install skills interactively:

```bash
npx cvmi add
```

Install a specific skill directly:

```bash
npx cvmi add --skill overview
npx cvmi add --skill typescript-sdk
npx cvmi add --skill server-dev
```

### Run a Gateway

Expose an MCP server to the Nostr network:

```bash
# Expose a local filesystem server
npx cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp

# Or with a remote HTTP MCP server
npx cvmi serve
```

### Use a Remote Server

Connect to a Nostr-based MCP server:

```bash
npx cvmi use npub1q...
```

## Verifying Installation

To verify CVMI is working correctly, try running the help command:

```bash
npx cvmi --help
```

You should see a list of available commands and options.

### Check Installed Skills

List all installed skills:

```bash
npx cvmi list
```

This will show you which skills are currently available in your environment.

## Global Installation (Optional)

If you prefer, you can install CVMI globally:

```bash
# Using npm
npm install -g cvmi

# Using yarn
yarn global add cvmi

# Using pnpm
pnpm add -g cvmi
```

After global installation, you can use `cvmi` directly without `npx`:

```bash
cvmi add
cvmi serve -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

## Next Steps

Now that you have CVMI installed, explore:

- [Commands Reference](/cvmi/commands) - Learn about all available commands
- [Configuration](/cvmi/configuration) - Set up your environment and preferences
