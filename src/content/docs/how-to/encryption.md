---
title: "Enable Encrypted Communication"
description: "How to configure your ContextVM server and client for end-to-end NIP-44 encryption."
---

# How-to: Enable Encrypted Communication

ContextVM supports end-to-end encryption to protect message contents and metadata from relays and observers. This implements the finalized [CEP-4](/reference/ceps/cep-4) and [CEP-19](/reference/ceps/cep-19) specifications.

This guide explains how to enable encryption on both the server and client sides.

## Encryption Overview

ContextVM uses NIP-44 to encrypt payloads and NIP-59 gift-wraps to hide metadata. 

There are two primary configuration options you must understand:

1. **`EncryptionMode`**: Should encryption be required, optional, or disabled?
2. **`GiftWrapMode`**: Should outer envelopes be saved permanently by relays (`Persistent`), or discarded rapidly (`Ephemeral`)?

## Configure the Server

By default, standard ContextVM server initialization uses plaintext. To change this, you update the `encryptionMode` in your transport configuration.

```typescript
import { NostrServerTransport } from "@contextvm/sdk";

const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  
  // Accept both plaintext and encrypted connections
  encryptionMode: "Optional", 
  
  // Prefer ephemeral wraps if the client supports them
  giftWrapMode: "Optional", 
});
```

### Server Encryption Modes

- `"Optional"` (Default): Accepts both encrypted and plaintext requests. The server will mirror the client's choice—replying to encrypted requests with encrypted responses, and plaintext with plaintext.
- `"Required"`: Rejects any plaintext requests. Use this for highly sensitive tools.
- `"Disabled"`: Rejects encrypted requests.

## Configure the Client

The client is responsible for initiating the connection. If the client uses encryption, the server will follow suit (if its policy permits).

```typescript
import { NostrClientTransport } from "@contextvm/sdk";

const transport = new NostrClientTransport({
  signer,
  relayHandler: relayPool,
  serverPubkey: "server-hex-key",
  
  // Force the client to encrypt all outbound messages
  encryptionMode: "Required",
  
  // Request that relays delete the outer envelope quickly
  giftWrapMode: "Ephemeral",
});
```

### Client Encryption Modes

- `"Required"`: Always encrypt outbound messages. If the server cannot decrypt them, the connection will fail.
- `"Optional"`: Attempt to use encryption if the server advertised support via its `support_encryption` discovery tag. Fall back to plaintext otherwise.
- `"Disabled"`: Always use plaintext.

## Verifying Encryption

To verify encryption is active, you can monitor the Nostr relay traffic using a raw relay inspector (or the logging output of the SDKs).

- **Plaintext** traffic appears as `kind: 25910` events with the JSON-RPC payload in the `content`.
- **Encrypted** traffic appears as `kind: 1059` (persistent gift-wrap) or `kind: 21059` (ephemeral gift-wrap). The `content` will be a random-looking NIP-44 ciphertext block.

## Rust Equivalent

If you are using the `rs-sdk`, you configure these modes using the typed `EncryptionMode` and `GiftWrapMode` enums when building your transport configuration:

```rust
use contextvm_sdk::{EncryptionMode, GiftWrapMode};
use contextvm_sdk::transport::client::NostrClientTransportConfig;

let config = NostrClientTransportConfig::default()
    .with_relay_urls(vec!["wss://relay.damus.io".to_string()])
    .with_server_pubkey("<server-pubkey>")
    .with_encryption_mode(EncryptionMode::Required)
    .with_gift_wrap_mode(GiftWrapMode::Ephemeral);
```

## Related Specifications

- [CEP-4: Encryption Support](/reference/ceps/cep-4)
- [CEP-19: Ephemeral Gift Wraps](/reference/ceps/cep-19)
