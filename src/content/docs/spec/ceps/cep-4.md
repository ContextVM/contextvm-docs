---
title: CEP-4 Encryption Support
description: End-to-end encryption for ContextVM messages using NIP-17 and NIP-59
---

# Encryption Support

**Status:** Final
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes optional end-to-end encryption for ContextVM messages to enhance privacy and security. The encryption mechanism leverages a simplified version of NIP-17 (Private Direct Messages) for secure message encryption and NIP-59 (Gift Wrap) pattern with no 'rumor' using NIP-59 gift wrapping for metadata protection. This approach ensures message content privacy and metadata protection while maintaining full compatibility with the standard protocol.

## Specification

### Encryption Support Discovery

Encryption support is advertised through the `support_encryption` tag in server initialization responses or public server announcements. The presence of this tag indicates that the server supports encryption; its absence signifies that the server does not support encryption:

```json
{
  "pubkey": "<server-pubkey>",
  "content": {
    /* server details */
  },
  "tags": [
    ["support_encryption"] // Presence alone indicates encryption support
    // ... other tags
  ]
}
```

Clients can discover encryption support by:

1. **Direct Discovery**: Check for the presence of the `support_encryption` tag in initialization responses
2. **Encrypted Handshake**: Attempt an encrypted initialization

### Message Encryption Flow

When encryption is enabled, ContextVM messages follow a simplified NIP-17 pattern with no 'rumor', using NIP-59 gift wrapping.

#### 1. Content Preparation

The request is prepared as usual, and should be signed:

```json
{
  "kind": 25910,
  "id": "<request-event-id>",
  "pubkey": "<client-pubkey>",
  "content": {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_weather",
      "arguments": {
        "location": "New York"
      }
    }
  },
  "tags": [["p", "<server-pubkey>"]],
  "sig": "<signature>"
}
```

#### 2. Seal Creation

The request is converted into a JSON string and encrypted to the recipient's public key, following NIP-44 encryption scheme.

#### 3. Gift Wrapping

The encrypted request is then gift-wrapped by placing it in the content field of a NIP-59 gift-wrap event.

```json
{
  "id": "<gift-wrap-hash>",
  "pubkey": "<random-pubkey>",
  "created_at": "<randomized-timestamp>",
  "kind": 1059,
  "tags": [["p", "<server-pubkey>"]],
  "content": "<nip44-encrypted-request>",
  "sig": "<random-key-signature>"
}
```

Server responses follow the same pattern.

The decrypted inner content contains the standard ContextVM response format. The id field used in responses should match the inner id field used in requests, not the id of the gift-wrap event.

#### Observations

While this encryption scheme is secure and private enough, it has a main limitation in metadata leakage protection, as the recipient's public key is added to the gift-wrap event as a `p` tag. Therefore, the only leaked metadata is the recipient's public key, but not the sender, the kind of event contained in the gift-wrap, or the timestamp of the event. This is a limitation of the NIP-59 gift-wrapping pattern.

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol. Encryption is entirely optional:

- **Existing servers** continue to work without modification
- **Existing clients** continue to work with existing servers
- **New encrypted communication** only occurs when both client and server support encryption

The only compatibility issue is that servers or clients might require encrypted communication. Therefore, if encryption is required and one of the participants does not support it, the communication will fail

## Reference Implementation

A reference implementation can be found in the [ContextVM sdk](https://github.com/ContextVM/sdk/blob/master/src/core/encryption.ts)
