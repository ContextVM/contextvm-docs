---
title: TypeScript SDK
description: Reference guide for using @contextvm/sdk effectively - core interfaces, signers, relay handlers, transports, and SDK patterns.
---

# TypeScript SDK Reference

Reference guide for using [`@contextvm/sdk`](/ts-sdk/quick-overview) effectively.

## Installation

```bash
npm install @contextvm/sdk
# or
bun add @contextvm/sdk
```

## Core Imports

```typescript
// Transports
import { NostrClientTransport, NostrServerTransport } from "@contextvm/sdk";

// Signers
import { PrivateKeySigner } from "@contextvm/sdk";

// Relay Handlers
import { ApplesauceRelayPool } from "@contextvm/sdk";

// Components
import { NostrMCPProxy, NostrMCPGateway } from "@contextvm/sdk";

// Core types and utilities
import {
  EncryptionMode,
  CTXVM_MESSAGES_KIND,
  SERVER_ANNOUNCEMENT_KIND,
  createLogger,
} from "@contextvm/sdk";
```

## Core Interfaces

### NostrSigner

Abstracts cryptographic signing:

```typescript
interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<NostrEvent>;
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}
```

Implement for custom key management (hardware wallets, browser extensions, etc.).

See [Custom Signer Development](/ts-sdk/signer/custom-signer-development) for details.

### RelayHandler

Manages relay connections:

```typescript
interface RelayHandler {
  connect(): Promise<void>;
  disconnect(relayUrls?: string[]): Promise<void>;
  publish(event: NostrEvent): Promise<void>;
  subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
  ): Promise<void>;
  unsubscribe(): void;
}
```

**Must be non-blocking** - `subscribe()` returns immediately.

## Signers

### PrivateKeySigner

Default signer using raw private key:

```typescript
const signer = new PrivateKeySigner("32-byte-hex-private-key");
const pubkey = await signer.getPublicKey();
```

**Security**: Never hardcode keys. Use environment variables.

See [Private Key Signer](/ts-sdk/signer/private-key-signer) for more details.

### Custom Signers

Implement `NostrSigner` for:

- Browser extensions (NIP-07)
- Hardware wallets
- Remote signing services
- Secure enclaves

See [Custom Signer Development](/ts-sdk/signer/custom-signer-development) for examples.

## Relay Handlers

### ApplesauceRelayPool (Recommended)

Production-grade relay management:

```typescript
const pool = new ApplesauceRelayPool([
  "wss://relay.contextvm.org",
  "wss://cvm.otherstuff.ai",
]);
```

Features:

- Automatic reconnection
- Connection monitoring
- RxJS-based observables
- Persistent subscriptions

See [Applesauce Relay Pool](/ts-sdk/relay/applesauce-relay-pool) for details.

### SimpleRelayPool (Deprecated)

Basic relay management:

```typescript
const pool = new SimpleRelayPool(relayUrls);
```

Use `ApplesauceRelayPool` for new projects.

See [Simple Relay Pool](/ts-sdk/relay/simple-relay-pool) for details.

## Encryption Modes

```typescript
enum EncryptionMode {
  OPTIONAL = "optional", // Use if supported (default)
  REQUIRED = "required", // Fail if not supported
  DISABLED = "disabled", // Never encrypt
}
```

See [CEP-4](/spec/ceps/cep-4) for encryption specification details.

## Logging

```typescript
import { createLogger } from "@contextvm/sdk/core";

const logger = createLogger("my-module");

logger.info("event.name", {
  module: "my-module",
  txId: "abc-123",
  durationMs: 245,
});
```

Configure via environment:

- `LOG_LEVEL=debug|info|warn|error`
- `LOG_DESTINATION=stderr|stdout|file`
- `LOG_FILE=/path/to/file`
- `LOG_ENABLED=true|false`

See [Logging](/ts-sdk/core/logging) for more details.

## Constants

| Constant | Value | Description |
| -------- | ----- | ----------- |
| `CTXVM_MESSAGES_KIND` | 25910 | Ephemeral messages |
| `SERVER_ANNOUNCEMENT_KIND` | 11316 | Server metadata |
| `TOOLS_LIST_KIND` | 11317 | Tools announcement |
| `RESOURCES_LIST_KIND` | 11318 | Resources announcement |
| `GIFT_WRAP_KIND` | 1059 | Encrypted messages |

See [Core Constants](/ts-sdk/core/constants) for complete reference.

## Common Patterns

### Error Handling

```typescript
try {
  await client.connect(transport);
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection failure
  }
}
```

### Retry Strategies

```typescript
const transport = new NostrClientTransport({
  signer,
  relayHandler: pool,
  serverPubkey,
  // Automatic retry is built-in
});
```

### Connection Lifecycle

```typescript
// Connect
await relayPool.connect();
await client.connect(transport);

// Use...

// Cleanup
await client.disconnect();
await relayPool.disconnect();
```

### Resource Cleanup

Always clean up resources to prevent memory leaks:

```typescript
process.on("SIGINT", async () => {
  await client.disconnect();
  await relayPool.disconnect();
  process.exit(0);
});
```

## Transports

### NostrServerTransport

Server-side transport for handling incoming connections:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: pool,
  isPublicServer: true,
  allowedPublicKeys: [...], // Optional whitelist
});
```

See [NostrServerTransport](/ts-sdk/transports/nostr-server-transport) for complete documentation.

### NostrClientTransport

Client-side transport for connecting to servers:

```typescript
const transport = new NostrClientTransport({
  signer,
  relayHandler: pool,
  serverPubkey: "...",
  encryptionMode: EncryptionMode.OPTIONAL,
});
```

See [NostrClientTransport](/ts-sdk/transports/nostr-client-transport) for complete documentation.

## Related Resources

- [Server Development](/cvmi/skills/server-dev) — Building servers
- [Client Development](/cvmi/skills/client-dev) — Building clients
- [Core Interfaces](/ts-sdk/core/interfaces) — Complete interface definitions
- [TypeScript SDK Quick Overview](/ts-sdk/quick-overview) — SDK introduction
