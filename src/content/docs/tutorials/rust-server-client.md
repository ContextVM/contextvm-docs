---
title: "Server & Client (Rust)"
description: "A step-by-step guide to building a native ContextVM server and client pair in Rust."
---

# Tutorial: Server & Client (Rust)

This tutorial walks through building a native ContextVM server and client pair using Rust. We will use the `contextvm_sdk` along with the `rmcp` crate to build an application that communicates securely over the Nostr network.

## What you'll build

You will create a Rust binary with two roles:

1. A **Server** that exposes an `echo` tool.
2. A **Client** that discovers tools on the server and calls `echo`.

## Prerequisites

- Rust toolchain (`cargo`, `rustc`)
- Access to a Nostr relay (e.g., `wss://relay.contextvm.org`)

---

## Step 1: Set up the project

Create a new Rust project:

```bash
cargo new rust-ctxvm-demo
cd rust-ctxvm-demo
```

Add the necessary dependencies using `cargo add`:

```bash
cargo add contextvm_sdk --features rmcp
cargo add rmcp --features server,client
cargo add tokio --features full
cargo add serde --features derive
cargo add serde_json anyhow tracing tracing-subscriber
```

## Step 2: Build the Server

We will implement a simple server using `rmcp` macros and attach it to a `NostrServerTransport`.

Create a file `src/server.rs`:

```rust
use contextvm_sdk::transport::server::{NostrServerTransport, NostrServerTransportConfig};
use contextvm_sdk::{signer, ServerInfo};
use rmcp::{
    ServerHandler, ServiceExt,
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::*,
    schemars, tool, tool_handler, tool_router,
};

#[derive(Clone)]
pub struct DemoServer {
    tool_router: ToolRouter<Self>,
}

impl DemoServer {
    pub fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct EchoParams {
    message: String,
}

#[tool_router]
impl DemoServer {
    #[tool(description = "Echo a message back unchanged")]
    async fn echo(
        &self,
        Parameters(EchoParams { message }): Parameters<EchoParams>,
    ) -> Result<CallToolResult, ErrorData> {
        Ok(CallToolResult::success(vec![Content::text(format!(
            "Echo: {message}"
        ))]))
    }
}

#[tool_handler]
impl ServerHandler for DemoServer {
    fn get_info(&self) -> rmcp::model::ServerInfo {
        rmcp::model::ServerInfo {
            protocol_version: ProtocolVersion::LATEST,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation {
                name: "rust-echo-server".to_string(),
                title: Some("Rust Echo Server".to_string()),
                version: "0.1.0".to_string(),
                description: None,
                icons: None,
                website_url: None,
            },
            instructions: None,
        }
    }
}

pub async fn run_server() -> anyhow::Result<()> {
    let signer = signer::generate();
    let pubkey = signer.public_key().to_hex();
    println!("Server starting. Pubkey: {}", pubkey);

    let transport = NostrServerTransport::new(
        signer,
        NostrServerTransportConfig::default()
            .with_relay_urls(vec!["wss://relay.contextvm.org".to_string()])
            .with_announced_server(false),
    ).await?;

    let service = DemoServer::new().serve(transport).await?;
    println!("Server ready. Press Ctrl+C to stop.");
    service.waiting().await?;
    Ok(())
}
```

## Step 3: Build the Client

The client connects to the server pubkey, requests its tools, and calls the echo method.

Create a file `src/client.rs`:

```rust
use contextvm_sdk::transport::client::{NostrClientTransport, NostrClientTransportConfig};
use contextvm_sdk::signer;
use rmcp::{
    model::{CallToolRequestParams, CallToolResult},
    ClientHandler, ServiceExt,
};

#[derive(Clone, Default)]
struct DemoClient;
impl ClientHandler for DemoClient {}

pub async fn run_client(server_pubkey: String) -> anyhow::Result<()> {
    let signer = signer::generate();
    println!("Client starting. Target Server: {}", server_pubkey);

    let transport = NostrClientTransport::new(
        signer,
        NostrClientTransportConfig::default()
            .with_relay_urls(vec!["wss://relay.contextvm.org".to_string()])
            .with_server_pubkey(server_pubkey),
    ).await?;

    let client = DemoClient.serve(transport).await?;

    let tools = client.list_all_tools().await?;
    println!("Discovered {} tool(s).", tools.len());

    let result = client
        .call_tool(CallToolRequestParams {
            name: "echo".into(),
            arguments: serde_json::from_value(serde_json::json!({
                "message": "Hello from the Rust client!"
            })).ok(),
            meta: None,
            task: None,
        })
        .await?;

    if let Some(content) = result.content.first() {
        if let rmcp::model::RawContent::Text(text) = &content.raw {
            println!("Result: {}", text.text);
        }
    }

    client.cancel().await?;
    Ok(())
}
```

## Step 4: Tie it together

Modify `src/main.rs` to run either the server or client based on arguments.

```rust
mod server;
mod client;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        println!("Usage:");
        println!("  cargo run -- server");
        println!("  cargo run -- client <server_pubkey>");
        return Ok(());
    }

    match args[1].as_str() {
        "server" => server::run_server().await,
        "client" => {
            let pubkey = args.get(2).expect("Missing server pubkey");
            client::run_client(pubkey.to_string()).await
        }
        _ => {
            println!("Invalid command");
            Ok(())
        }
    }
}
```

## Step 5: Run both

Open two terminals.

In terminal 1, run the server:

```bash
cargo run -- server
```

Note the printed server pubkey (e.g., `a1b2c3...`).

In terminal 2, run the client passing the server pubkey:

```bash
cargo run -- client a1b2c3...
```

You should see the client list the tools, invoke `echo`, and print `Result: Echo: Hello from the Rust client!`.
