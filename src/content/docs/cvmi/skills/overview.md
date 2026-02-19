---
title: Skills Overview
description: An overview of CVMI skills - LLM-optimized guides for building and using the ContextVM protocol.
---

# CVMI Skills Overview

CVMI skills are LLM-optimized guides that provide documentation, code templates, and best practices for building and using the ContextVM protocol. They are designed to be used directly by AI assistants to help you implement ContextVM effectively.

## What are CVMI Skills?

Skills are specialized documentation packages that contain:

- **Contextual knowledge** - Deep understanding of specific ContextVM topics
- **Code templates** - Ready-to-use starting points for servers and clients
- **Best practices** - Proven patterns for production deployments
- **Reference materials** - Detailed specifications and guides

Unlike traditional documentation, skills are optimized for LLM consumption - they provide the right context at the right time to help AI assistants give you accurate, relevant guidance.

## How Skills Work

### Installation

Skills are installed to `~/.agents/` and managed through the CVMI CLI:

```bash
# Install skills interactively
cvmi add

# Install specific skills
cvmi add concepts
cvmi add server-dev
cvmi add client-dev

# List installed skills
cvmi list

# Remove a skill
cvmi remove concepts
```

### Interactive Picker

The `cvmi add` command provides an interactive picker that lets you browse and select skills:

```bash
$ cvmi add

? Select skills to install: (Press <space> to select, <a> to toggle all)
 ❯◯ concepts - Core concepts and architecture
  ◯ server-dev - Server development guide
  ◯ client-dev - Client development guide
  ◯ typescript-sdk - TypeScript SDK reference
  ◯ payments - Payments integration (CEP-8)
  ◯ deployment - Production deployment guide
  ◯ troubleshooting - Common issues and solutions
```

## Available Skills

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [`concepts`](/cvmi/skills/concepts) | Core concepts and architecture | Learning ContextVM fundamentals |
| [`server-dev`](/cvmi/skills/server-dev) | Server development guide | Building ContextVM servers |
| [`client-dev`](/cvmi/skills/client-dev) | Client development guide | Building ContextVM clients |
| [`typescript-sdk`](/cvmi/skills/typescript-sdk) | TypeScript SDK reference | Working with `@contextvm/sdk` |
| [`payments`](/cvmi/skills/payments) | Payments integration (CEP-8) | Implementing paid capabilities |
| [`deployment`](/cvmi/skills/deployment) | Production deployment | Deploying to production |
| [`troubleshooting`](/cvmi/skills/troubleshooting) | Common issues and solutions | Debugging problems |

### Skill Details

#### [Concepts](/cvmi/skills/concepts)
Understand ContextVM's core concepts, architecture decisions, and frequently asked questions. Covers what ContextVM is, why it uses Nostr, decentralization benefits, public vs private servers, and comparisons with traditional MCP.

#### [Server Development](/cvmi/skills/server-dev)
Build MCP servers that expose capabilities over Nostr using the `@contextvm/sdk`. Includes quick start guides, transport configuration, access control, public server announcements, and debugging techniques.

#### [Client Development](/cvmi/skills/client-dev)
Build MCP clients that connect to ContextVM servers over Nostr. Covers server discovery, connection patterns, stateless mode, proxy pattern for existing clients, and the `ctxcn` typed client generator.

#### [TypeScript SDK](/cvmi/skills/typescript-sdk)
Reference guide for using `@contextvm/sdk` effectively. Documents core interfaces, signers, relay handlers, transports, encryption modes, logging, and SDK patterns.

#### [Payments](/cvmi/skills/payments)
Implement CEP-8 payments to charge for specific capabilities. Includes server-side payment processing, client-side payment handling, built-in Lightning rails (NWC, LNbits), and custom rail development.

#### [Deployment](/cvmi/skills/deployment)
Deploy ContextVM servers and clients in production. Covers environment variables, Docker containers, relay configuration, security best practices, health checks, and monitoring.

#### [Troubleshooting](/cvmi/skills/troubleshooting)
Diagnose and resolve common ContextVM issues. Includes connection problems, relay issues, encryption failures, authentication errors, debugging techniques, and verification tools.

## How to Use Skills with LLMs

### In Your AI Assistant

When working with an AI assistant that has access to CVMI:

1. **Mention the skill** - Tell the AI which skill you're working with
   - "Using the server-dev skill, help me set up access control"
   - "According to the deployment skill, how should I manage keys?"

2. **Provide context** - Share relevant files or error messages
   - "I'm getting this error when connecting..."
   - "Here's my current server configuration..."

3. **Ask specific questions** - Skills work best with focused queries
   - "How do I whitelist specific clients?"
   - "What's the difference between public and private servers?"

### Skill Selection Guide

Use this decision table to find the right skill:

| Goal | Recommended Skill |
|------|-------------------|
| Learn ContextVM fundamentals | [`concepts`](/cvmi/skills/concepts) |
| Build a new server | [`server-dev`](/cvmi/skills/server-dev) |
| Build a new client | [`client-dev`](/cvmi/skills/client-dev) |
| Understand SDK interfaces | [`typescript-sdk`](/cvmi/skills/typescript-sdk) |
| Add payments to your service | [`payments`](/cvmi/skills/payments) |
| Deploy to production | [`deployment`](/cvmi/skills/deployment) |
| Debug connection issues | [`troubleshooting`](/cvmi/skills/troubleshooting) |

## Next Steps

- [Install CVMI](/cvmi/installation) - Get the CVMI CLI
- [Install Skills](/cvmi/commands#cvmi-add) - Add skills to your system
- [Explore Concepts](/cvmi/skills/concepts) - Learn ContextVM fundamentals
