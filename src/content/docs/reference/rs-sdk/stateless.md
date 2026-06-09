---
title: "Stateless Mode"
description: "ContextVM Rust SDK documentation for Stateless Mode"
---


Stateless mode is a client-side transport behavior enabled through `NostrClientTransportConfig::with_stateless()`.

It is designed for flows where the client should behave as if initialization succeeded without waiting for the server to answer over the network.

## What stateless mode actually does

When `is_stateless` is enabled on `NostrClientTransportConfig`, the client transport intercepts two parts of the normal MCP startup sequence inside `NostrClientTransport::send()`:

- an outgoing `initialize` request
- an outgoing `notifications/initialized` notification

For the `initialize` request, the transport locally emulates a successful initialize response instead of publishing the request to the relay network.

For the `notifications/initialized` notification, the transport simply swallows the notification and does not send it over the network.

## What does not change

Stateless mode does not make the whole transport local-only.

After initialization is emulated, normal requests are still serialized and sent through Nostr.

That means stateless mode changes startup semantics, not the rest of the request/response transport model.

## When to use it

Use stateless mode when:

- you want faster startup for short-lived clients
- you control both sides and do not need a server-provided initialize payload
- you are using the proxy or native client flow mainly for direct tool calls after startup

Avoid it when:

- you need the server's real initialize response
- your workflow depends on server-specific initialize metadata
- you want startup behavior to strictly follow the network exchange

## Example

```rust
use contextvm_sdk::transport::client::{
    NostrClientTransport, NostrClientTransportConfig,
};
use contextvm_sdk::{signer, EncryptionMode, GiftWrapMode};
use rmcp::{ClientHandler, ServiceExt};

#[derive(Clone, Default)]
struct DemoClient;

impl ClientHandler for DemoClient {}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let signer = signer::generate();

    let transport = NostrClientTransport::new(
        signer,
        NostrClientTransportConfig::default()
            .with_relay_urls(vec!["wss://relay.contextvm.org".to_string()])
            .with_server_pubkey("<server-hex-pubkey>")
            .with_encryption_mode(EncryptionMode::Optional)
            .with_gift_wrap_mode(GiftWrapMode::Optional)
            .with_stateless(true),
    )
    .await?;

    let client = DemoClient.serve(transport).await?;

    // Initialize completed locally; subsequent requests still go over Nostr.
    let tools = client.list_all_tools().await?;
    println!("Discovered {} tool(s)", tools.len());

    client.cancel().await?;
    Ok(())
}
```

## Emulated initialize shape

The emulated initialize response includes:

- `protocolVersion`
- `serverInfo`
- `capabilities`

This is verified by the transport tests in the repository.

The placeholder `serverInfo.name` used by the emulated response is currently `Emulated-Stateless-Server`.

## Relationship to discovery and learned capabilities

Stateless mode does not disable peer capability learning.

The client still advertises its own capabilities through discovery tags, and it still learns server capabilities from inbound tags later in the session.

So even in stateless mode, encryption and ephemeral gift-wrap support can still be learned from later inbound traffic.

## Practical limitation

Because the initialize roundtrip is skipped, stateless mode should be treated as an optimization for compatible workflows, not as a universal replacement for normal MCP startup.


---
*This page was ported from the [ContextVM Rust SDK repository](https://github.com/ContextVM/rs-sdk/tree/main/docs/stateless.md).*
