---
title: "Transport Modes"
description: "ContextVM Rust SDK documentation for Transport Modes"
---


This page focuses on the transport behavior switches that are spread across the SDK APIs:

- `EncryptionMode`
- `GiftWrapMode`
- stateless mode via `NostrClientTransportConfig::with_stateless()`

The existing guides mention these knobs in context. This page collects them into one operational reference.

## Encryption modes

`EncryptionMode` controls whether the transport accepts or emits plaintext vs encrypted direct traffic.

The three modes are:

- `Optional`: mirror mode; encrypted traffic is allowed and plaintext is also allowed
- `Required`: reject plaintext direct traffic and require encrypted direct traffic
- `Disabled`: reject encrypted direct traffic and use plaintext only

The exact enforcement is implemented in the client and server transport layers.

### What `Optional` really means

`Optional` does not mean "always plaintext is fine" or "always encrypt everything".

At the base transport level, the outgoing encryption choice for direct traffic is mirror-oriented:

- `EncryptionMode::Required` always encrypts direct traffic
- `EncryptionMode::Disabled` never encrypts direct traffic
- `EncryptionMode::Optional` uses the known encryption state of the peer interaction when available

## Gift-wrap modes

`GiftWrapMode` only matters when traffic is encrypted.

The three modes are:

- `Optional`: accept both persistent and ephemeral gift wraps; prefer persistent until ephemeral support is known
- `Ephemeral`: require kind `21059`
- `Persistent`: require kind `1059`

The acceptance rules are defined by `GiftWrapMode::allows_kind()`, and whether a mode can advertise or choose ephemeral wrapping is defined by `GiftWrapMode::supports_ephemeral()`.

### Client outbound behavior

Client selection follows this behavior:

- `Persistent` always uses persistent gift wrap
- `Ephemeral` always uses ephemeral gift wrap
- `Optional` uses persistent first, then switches to ephemeral once peer support is learned

### Server outbound behavior

Server response and notification selection follow the current transport implementation.

Important server rules:

- if a correlated encrypted request used a valid wrap kind, the server mirrors it when possible
- for notifications, learned client support for ephemeral gift wrap can change the fallback behavior
- `Optional` still falls back to persistent when no stronger signal exists

## Stateless mode

Stateless mode is client-only and is controlled by `NostrClientTransportConfig::with_stateless()`.

It changes initialization behavior only:

- outgoing `initialize` is emulated locally
- outgoing `notifications/initialized` is suppressed
- later requests still go through the normal Nostr transport path

See the dedicated stateless mode guide in the Rust SDK reference section.

## Capability tags and mode signaling

Mode choices affect discovery and capability tags.

### Client-side signaling

Client tags follow this behavior:

- if encryption is not disabled, the client advertises encryption support
- if gift-wrap mode is not persistent, the client also advertises ephemeral gift-wrap support

### Server-side signaling

Server announcement tags follow this behavior:

- if encryption is not disabled, the server advertises encryption support
- if gift-wrap mode supports ephemeral wrapping, the server also advertises ephemeral support

This is why `GiftWrapMode::Optional` and `GiftWrapMode::Ephemeral` both advertise ephemeral support, while `GiftWrapMode::Persistent` does not.

## Example configurations

```rust
use contextvm_sdk::{EncryptionMode, GiftWrapMode};
use contextvm_sdk::transport::client::NostrClientTransportConfig;

let interoperable = NostrClientTransportConfig::default()
    .with_server_pubkey("<server-hex-pubkey>")
    .with_encryption_mode(EncryptionMode::Optional)
    .with_gift_wrap_mode(GiftWrapMode::Optional);

let strict_encrypted = NostrClientTransportConfig::default()
    .with_server_pubkey("<server-hex-pubkey>")
    .with_encryption_mode(EncryptionMode::Required)
    .with_gift_wrap_mode(GiftWrapMode::Persistent);

let stateless_client = NostrClientTransportConfig::default()
    .with_server_pubkey("<server-hex-pubkey>")
    .with_encryption_mode(EncryptionMode::Optional)
    .with_gift_wrap_mode(GiftWrapMode::Optional)
    .with_stateless(true);
```


---
*This page was ported from the [ContextVM Rust SDK repository](https://github.com/ContextVM/rs-sdk/tree/main/docs/transport-modes.md).*
