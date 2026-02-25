---
title: Skills Overview
description: An overview of CVMI skills - LLM-optimized guides for building with ContextVM.
---

# Skills Overview

CVMI skills are LLM-optimized guides that help AI assistants provide accurate guidance for building with ContextVM. Unlike traditional documentation, skills are designed to give AI the right context at the right time.

## What are Skills?

Skills are specialized documentation packages installed via CVMI that contain:

- **Contextual knowledge** - Deep understanding of ContextVM topics
- **Code templates** - Ready-to-use starting points
- **Best practices** - Production-ready patterns
- **Reference materials** - Detailed specifications

## Available Skills

| Skill | Description |
|-------|-------------|
| **overview** | ContextVM fundamentals, protocol design, MCP integration |
| **concepts** | Core concepts of running MCP over Nostr |
| **server-dev** | Server development with NostrServerTransport |
| **client-dev** | Client development with NostrClientTransport |
| **typescript-sdk** | TypeScript SDK usage and common patterns |
| **payments** | CEP-8 payments integration |
| **deployment** | Docker deployment and production best practices |
| **troubleshooting** | Common issues and debugging strategies |

## Installing Skills

```bash
# Install skills interactively
npx cvmi add

# Install specific skills
npx cvmi add overview
npx cvmi add server-dev
```

Skills are installed to `~/.agents/` and managed through the CVMI CLI.

## When to Use Skills

Use skills when:
- Working with an AI assistant to build with ContextVM
- The AI has the relevant skill installed
- You need context-specific guidance on implementation

The skills provide the AI with detailed implementation knowledge that can guide you through building servers, clients, payments integration, and deployment.
