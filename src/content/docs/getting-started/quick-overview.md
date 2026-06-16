---
title: Quick Overview
description: An overview of the ContextVM documentation, including the specification and SDK documentation.
---

Welcome to the ContextVM documentation! This guide provides a brief overview of what you'll find in our documentation to help you get started with ContextVM.

## Documentation Structure

Our documentation is organized into several main sections:

### 🚀 Getting Started

- **Quick Overview**: This page - a brief introduction to what ContextVM offers

### 📋 Specification

- **[Specification](/reference/spec/ctxvm-draft-spec)**: The official ContextVM draft specification detailing the protocol
- **[CEP - Guidelines](/reference/spec/cep-guidelines)**: ContextVM Enhancement Proposal guidelines for contributing to the protocol

### 🛠️ ts-SDK

The TypeScript SDK provides tools and libraries for building applications with ContextVM:

- **[SDK Quick Overview](/reference/ts-sdk/quick-overview)**: A comprehensive overview of the SDK's modules and core concepts
- **Core Concepts**: Fundamental definitions, constants, interfaces, and utilities
- **Transports**: Communication modules for MCP over Nostr
- **Components**: Gateway, Relay Handlers, Signers, and Proxy implementations
- **Tutorials**: Practical examples and guides

### 🦀 rs-SDK

The Rust SDK provides a native Rust implementation of the ContextVM protocol:

- **[SDK Overview](/reference/rs-sdk/overview)**: Introduction to the Rust SDK and its architecture
- **Native Transports**: Server, client, and low-level Nostr transport guides
- **Design & Architecture**: Detailed breakdown of components and implementation decisions

## What is ContextVM?

ContextVM is a protocol that bridges the Model Context Protocol (MCP) with the Nostr network, enabling decentralized communication. It allows MCP servers and clients to communicate over the Nostr protocol, leveraging its decentralized infrastructure for secure and private interactions. The protocol is designed to be used programmatically or by Large Language Models (LLMs). Client and server interactions can be triggered by a user's input through an interface or by an LLM, as the underlying MCP protocol allows LLMs to use it.

## Key Features

- **Decentralized Communication**: Use Nostr's decentralized network for MCP communication
- **Security First**: Leveraging Nostr's cryptographic primitives for verification, authorization, and additional features
- **Easy Integration**: TypeScript and Rust SDKs to work with ContextVM

## Getting Started

1. **Read the Specification**: Start with the [ContextVM specification](/reference/spec/ctxvm-draft-spec) to understand the protocol
2. **Explore the SDKs**: Check out the [TypeScript SDK Quick Overview](/reference/ts-sdk/quick-overview) or [Rust SDK Overview](/reference/rs-sdk/overview) for development guidance
3. **Follow Tutorials**: Work through practical examples to see ContextVM in action

## Next Steps

Choose your path based on your interests:

- **Protocol Development**: Dive into the [Specification](/reference/spec/ctxvm-draft-spec) to understand the protocol details
- **SDK Development**: Start with the [TypeScript SDK Quick Overview](/reference/ts-sdk/quick-overview) or [Rust SDK Overview](/reference/rs-sdk/overview) to begin building with ContextVM
- **Contributing**: Learn about contributing to the protocol with [CEP Guidelines](/reference/spec/cep-guidelines)

For the latest updates and community discussions, visit our [GitHub repository](https://github.com/contextvm/).
