---
title: Quick Overview
description: An overview of the @contextvm/sdk, including its modules and core concepts.
---

# SDK Quick Overview

This overview introduces the essential modules and core concepts of the `@contextvm/sdk`. Understanding these fundamentals will help you leverage the full power of the ContextVM protocol.

## Installation

`@contextvm/sdk` is distributed as an NPM package, making it easy to integrate into your project.

## Install the SDK

Run the following command in your terminal:

```bash
npm install @contextvm/sdk
```

This will install the SDK and its dependencies into your project.

**Note:** If you are using a different package manager than NPM, just replace `npm` with the appropriate command for your package manager.

## Modules Introduction

The SDK is organized into several modules, each providing a specific set of functionalities:

- **[Core](/core/interfaces)**: Contains fundamental definitions, constants, interfaces, and utilities (e.g., encryption, serialization).
- **[Transports](/transports/base-nostr-transport)**: Critical for communication, this module provides `NostrClientTransport` and `NostrServerTransport` implementations for enabling MCP over Nostr.
- **[Signer](/signer/nostr-signer-interface)**: Provides cryptographic signing capabilities required for Nostr events
- **[Relay](/relay/relay-handler-interface)**: Manages Nostr relay connections, abstracting the complexity of relay interactions.
- **[Proxy](/proxy/overview)**: A client-side MCP server that connects to other servers through Nostr, exposing their capabilities locally, specially useful for clients that don't natively support Nostr transport.
- **[Gateway](/overview)**: An MCP server transport that binds to another MCP server, exposing its capabilities to the Nostr network, specially useful for servers that don't natively support Nostr transport.

## Core Concepts

The `@contextvm/sdk` is built around a few core concepts that enable the bridging of MCP and Nostr.

### Signers and Relay Handlers

At the heart of the SDK are two key interfaces:

- **`NostrSigner`**: An interface for signing Nostr events. The SDK includes a default `PrivateKeySigner`, but you can create a custom implementation to integrate with other signing mechanisms (e.g., Window.nostr for web, remote signers, etc).
- **`RelayHandler`**: An interface for managing connections to Nostr relays. The default `SimpleRelayPool` provides basic relay management, but you can implement your own logic for more sophisticated relay selection and management.

These components are fundamental for creating and broadcasting Nostr events, which are the backbone of ContextVM communication.

### Nostr Transports

The SDK provides two specialized transports to send and receive MCP messages over the Nostr network:

- [`NostrClientTransport`](/transports/nostr-client-transport): Used by MCP clients to connect to remote MCP servers exposed via Nostr.
- [`NostrServerTransport`](/transports/nostr-server-transport): Used by MCP servers to expose their capabilities through Nostr.

These transports handle the serialization of MCP messages into Nostr events and manage the communication flow.

### Bridging Components: Proxy and Gateway

To simplify integration with existing MCP applications, the SDK provides two high-level bridging components:

- [`NostrMCPProxy`](/proxy/overview): A client-side bridge that allows an MCP client to communicate with a remote MCP server over Nostr without requiring native Nostr support in the client.
- [`NostrMCPGateway`](/overview): A server-side bridge that exposes an existing MCP server to the Nostr network, allowing it to be discovered and used by Nostr-native clients.

These components abstract away the underlying transport complexities, making it easy to connect conventional MCP setups with the decentralized Nostr ecosystem.

## Next Steps

Now that you have a basic understanding of the SDK's modules and concepts, you are ready to dive deeper. Explore the **Core Modules** section to learn about the fundamental interfaces and data structures.
