---
title: CEP-16 Client Public Key Injection
description: Optional injection of client public key in request metadata for enhanced server integration
---

# Client Public Key Injection

**Status:** Final
**Author:** ContextVM-org
**Type:** Informational

## Abstract

This CEP describes a mechanism for Nostr server transports to inject client public key information into request metadata. By embedding the client's public key in the `_meta` field of client-to-server messages, underlying servers can access client identification information for authentication, authorization, and enhanced integration purposes.

## Motivation

The Nostr protocol transport layer previously lacked a standardized method for embedding client identification directly within message metadata. By incorporating the client's public key into the `_meta` field of MCP requests, we can:

- Improve authentication mechanisms
- Enable more granular authorization processes
- Enhance overall system integration between transports and underlying servers

## Specification

### Configuration

The feature is controlled by the `injectClientPubkey` option in the `NostrServerTransport` configuration:

```typescript
const transport = new NostrServerTransport({
  signer: new PrivateKeySigner(serverPrivateKey),
  relayHandler: new ApplesauceRelayPool([relayUrl]),
  injectClientPubkey: true, // Enable client pubkey injection
});
```

### Default Behavior

- `injectClientPubkey` defaults to `false` for backward compatibility
- When set to `false`, requests are passed to the underlying server without modification
- When set to `true`, the client public key is injected into the request metadata

### Injection Mechanism

When a new message is received from a client and `injectClientPubkey` is enabled:

1. The server transport extracts the client's public key from the Nostr event
2. The transport embeds the `clientPubkey` field in the message's `_meta` field
3. The modified request is then passed to the underlying server

The injected metadata follows this structure:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "example_tool",
    "arguments": {}
  },
  "_meta": {
    "clientPubkey": "<client-public-key-hex>"
  }
}
```

### Metadata Field Integration

The `_meta` field is a [general-purpose metadata container](https://modelcontextprotocol.io/specification/2025-11-25/basic/index#meta) already used by MCP servers for `progressToken` and other metadata. The `clientPubkey` is added to this existing structure, ensuring compatibility with current implementations.

## Implementation Details

This feature is available starting from ContextVM SDK version 0.1.41. The injection occurs during message processing in the server transport layer, before the request reaches the underlying MCP server implementation.

## Backward Compatibility

This enhancement is fully backward compatible:

- Existing servers continue to work without modification
- Existing clients are unaffected by this server-side feature
- The feature is opt-in and disabled by default
- When disabled, there is no change to request structure or behavior

## Use Cases

- **Authentication**: Servers can verify client identity without additional protocol overhead
- **Authorization**: Implement per-client access controls based on public key
- **Logging**: Track client activity and usage patterns
- **Rate Limiting**: Apply rate limits on a per-client basis
- **Personalization**: Provide client-specific responses or data

## Reference Implementation

A reference implementation can be found in the [ContextVM SDK Nostr server transport](https://github.com/ContextVM/sdk/blob/master/src/transport/nostr-server-transport.ts) starting from version 0.1.41.

## Related Specification

- MCP General Fields: [Metadata](https://modelcontextprotocol.io/specification/2025-11-25/basic/index#meta)
