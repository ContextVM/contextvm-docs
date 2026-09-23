---
title: Skills Overview
description: Install and use CVMI skills — documentation packages with templates, references, and LLM-oriented guides for building with ContextVM.
---

# Skills Overview

CVMI skills are documentation packages you install locally. Each skill includes code templates, reference implementations, and focused guides for a ContextVM topic. They are useful if you are reading and copying from those materials yourself, and they also give AI assistants the right context when you are working with one.

Unlike the full documentation site, a skill is a small, topic-scoped bundle: install only what you are building with.

## What are Skills?

Skills are specialized documentation packages installed via CVMI that contain:

- **Contextual knowledge** - Deep understanding of ContextVM topics
- **Code templates** - Ready-to-use starting points
- **Best practices** - Production-ready patterns
- **Reference materials** - Detailed specifications

## Available Skills

| Skill               | Description                                              |
| ------------------- | -------------------------------------------------------- |
| **overview**        | ContextVM fundamentals, protocol design, MCP integration |
| **concepts**        | Core concepts of running MCP over Nostr                  |
| **server-dev**      | Server development with NostrServerTransport             |
| **client-dev**      | Client development with NostrClientTransport             |
| **typescript-sdk**  | TypeScript SDK usage and common patterns                 |
| **payments**        | CEP-8 payments integration                               |
| **deployment**      | Docker deployment and production best practices          |
| **troubleshooting** | Common issues and debugging strategies                   |

## Installing Skills

```bash
# Install skills interactively
npx cvmi add

# Install specific skills
npx cvmi add overview
npx cvmi add server-dev
```

Pass more than one name to install several skills at once:

```bash
npx cvmi add overview payments deployment
```

Skills are installed to `~/.agents/` and managed through the CVMI CLI.

## When to Use Skills

Install a skill when you want a compact, copyable package for a specific task:

- Building a server, client, payments flow, or deployment and you want the templates plus references in one place
- Reading implementation patterns without paging through the full docs
- Working with an AI assistant that should follow ContextVM conventions

The skills give you (and any assistant you use) detailed implementation knowledge for servers, clients, payments, and deployment.
