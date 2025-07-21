---
title: Encryption
description: An overview of the encryption mechanism in the @contextvm/sdk.
---

# Encryption

The `@contextvm/sdk` supports optional end-to-end encryption for all communication, providing enhanced privacy and security. This section explains the encryption mechanism, how to enable it, and the underlying principles.

## Overview

ContextVM's encryption leverages a simplified version of [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) to ensure:

1.  **Message Content Privacy**: All MCP message content is encrypted using NIP-44.
2.  **Metadata Protection**: The gift wrap pattern conceals participant identities and other metadata.
3.  **Selective Encryption**: Clients and servers can negotiate encryption on a per-session basis.

When encryption is enabled, all ephemeral messages (kind 25910) are wrapped in a kind 1059 gift wrap event. Server announcements and capability lists remain unencrypted for public discoverability.

## How It Works

The encryption flow is designed to be secure and efficient:

1.  **Content Preparation**: The original MCP message is serialized into a standard Nostr event.
2.  **Gift Wrapping**: The entire event is then encrypted using `nip44.v2` and wrapped inside a "gift wrap" event (kind 1059). A new, random keypair is generated for each gift wrap.
3.  **Transmission**: The encrypted gift wrap event is published to the Nostr network.

The recipient then unwraps the gift using their private key to decrypt the original message.

### Why a Simplified NIP-17/NIP-59 Pattern?

The standard implementation of NIP-17 is designed for persistent private messages and includes a "rumor" and "seal" mechanism to prevent message leakage. Since ContextVM messages are ephemeral and not intended to be stored by relays, this complexity is unnecessary. The SDK uses a more direct gift-wrapping approach that provides strong encryption and metadata protection without the overhead of the full NIP-17 standard.

## Enabling Encryption

Encryption is configured at the transport level using the `EncryptionMode` enum. You can set the desired mode when creating a `NostrClientTransport` or `NostrServerTransport`.

```typescript
import { NostrClientTransport } from "@ctxvm/sdk/transport";
import { EncryptionMode } from "@ctxvm/sdk/core";

const transport = new NostrClientTransport({
  // ... other options
  encryptionMode: EncryptionMode.OPTIONAL, // or REQUIRED, DISABLED
});
```

### `EncryptionMode`

- **`REQUIRED`**: The transport will only communicate with peers that support encryption. If the other party does not support it, the connection will fail.
- **`OPTIONAL`**: (Default) The transport will attempt to use encryption if the peer supports it. If not, it will fall back to unencrypted communication.
- **`DISABLED`**: The transport will not use encryption, even if the peer supports it.

## Encryption Support Discovery

Clients and servers can discover if a peer supports encryption in two ways:

1.  **Server Announcements**: Public server announcements (kind 11316) include a `support_encryption` tag to indicate that the server is capable of encrypted communication.
2.  **Initialization Handshake**: During the MCP initialization process, both the client and server can signal their support for encryption.

## API Reference

The core encryption functions are exposed in the `core` module:

- `encryptMessage(message: string, recipientPublicKey: string): NostrEvent`
- `decryptMessage(event: NostrEvent, signer: NostrSigner): Promise<string>`

These functions handle the low-level details of gift wrapping and unwrapping, but in most cases, you will interact with encryption through the transport's `encryptionMode` setting.

## Next Steps

Now that you understand how encryption works, let's look at the [Constants](/core/constants) used throughout the SDK.
