---
title: ContextVM SDK Documentation
description: A comprehensive guide to the ContextVM SDK
---

# @contextvm/sdk: The Official SDK for the ContextVM Protocol

Welcome to the official documentation for the **@contextvm/sdk**, a JavaScript/TypeScript library for the Context Vending Machine (ContextVM) Protocol. This SDK provides the tools to bridge Nostr and the Model Context Protocol (MCP), enabling decentralized discovery, access and exposure of computational services.

## What is ContextVM?

The Context Vending Machine (ContextVM) protocol defines how [Nostr](https://nostr.com/) and Model Context Protocol can be used to expose MCP server capabilities. It enables standardized usage of these resources through a decentralized, cryptographically secure messaging system. By integrating MCP with Nostr, ContextVM offers:

- **Discoverability**: MCP servers can be discovered through the Nostr network without centralized registries.
- **Verifiability**: All messages are cryptographically signed using Nostr's public keys.
- **Authorization**: No complex authorization logic required, just cryptography.
- **Decentralization**: No single point of failure for service discovery or communication.
- **Protocol Interoperability**: Both MCP and ContextVMs utilize JSON-RPC patterns, enabling seamless communication.

This documentation serves as the primary entry point for developers and individuals interested in learning more about ContextVM and its SDK.

## SDK Overview

The `@contextvm/sdk` provides the necessary components to interact with the CTXVM Protocol:

- **Core Module**: Contains fundamental definitions, constants, interfaces, and utilities (e.g., encryption, serialization).
- **Transports**: Critical for communication, providing `NostrClientTransport` and `NostrServerTransport` implementations for enabling MCP over Nostr.
- **Proxy**: A client-side MCP server that connects to other servers through Nostr, exposing server capabilities locally. Particularly useful for clients that don't natively support Nostr transport.
- **Gateway**: Implements Nostr server transport, binding to another MCP server and exposing its capabilities through the Nostr network.
- **Relay**: Functionality for managing Nostr relays, abstracting relay interactions.
- **Signer**: Provides cryptographic signing capabilities required for Nostr events.

Both the Proxy and Gateway leverage Nostr transports, allowing existing MCP servers to maintain their conventional transports while gaining Nostr interoperability.

## How to Use These Docs

This documentation is structured to guide you from initial setup to advanced implementation. We recommend starting with the "Getting Started" section and then exploring the modules most relevant to your use case.

- **Getting Started**: Covers installation and a high-level overview of the SDK.
- **Core Modules**: Details the fundamental interfaces, encryption methods, and constants.
- **Transports, Signer, Relay**: Deep dives into the key components for communication and security.
- **Proxy & Gateway**: Explains how to use the bridging components.
- **Tutorials**: Provides practical, step-by-step examples.

Let's begin by setting up your environment in the [Quick Overview](getting-started/quick-overview/).
