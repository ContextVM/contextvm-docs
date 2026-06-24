---
title: "UniFFI Bindings"
description: "Use the ContextVM Rust SDK from Python, Kotlin, Swift, and C through the contextvm-ffi bindings, including build, code generation, and memory management."
---

# UniFFI Bindings (contextvm-ffi)

The `contextvm-ffi` crate exposes the Rust SDK to non-Rust callers. It ships two binding surfaces:

- a flat **C ABI** in `headers/contextvm.h`
- **UniFFI** objects for **Python**, **Kotlin**, and **Swift**

Async SDK operations are driven by an internal Tokio runtime, so foreign callers use blocking functions and do not need to manage Rust async state.

## The one rule: bindings and native lib must come from the same release

UniFFI embeds a **contract version** and a **per-function checksum** into both the compiled native library and the generated binding file (`contextvm_ffi.py`, the Swift/Kotlin equivalent). At import time the binding recomputes them against the library and aborts with `InternalError("UniFFI ... mismatch")` if they differ.

Always take the native library and the binding file from the **same GitHub Release / same CI run**. Never mix an old binding with a new native library.

## Build the shared library

```bash
cd contextvm-ffi
cargo build --release
```

Outputs:

- Linux: `target/release/libcontextvm_ffi.so`
- macOS: `target/release/libcontextvm_ffi.dylib`
- Windows: `target/release/contextvm_ffi.dll`

## Generate UniFFI bindings

Build the shared library first, then generate bindings from the compiled library metadata. The bindgen version **must match** the runtime `uniffi` version in `Cargo.toml` — UniFFI embeds a contract version and per-function checksums into both the library and the generated file, and a mismatch aborts at import time.

The bindgen CLI is not published to crates.io; install it from git, pinned to the tag matching your runtime version (`0.31.x` here):

```bash
cd contextvm-ffi
cargo build

cargo install --git https://github.com/mozilla/uniffi-rs --tag v0.31.2 uniffi-bindgen-cli --locked

uniffi-bindgen-cli generate target/debug/libcontextvm_ffi.so \
  --library \
  --language python \
  --out-dir python/
```

Use `--language kotlin` or `--language swift` for the other supported targets. The generated Python file expects the native library (`libcontextvm_ffi.so` / `.dylib` / `contextvm_ffi.dll`) to sit **next to it** at import time.

## C API

Include `headers/contextvm.h` and link against `libcontextvm_ffi`.

```c
#include "contextvm.h"

CvmError *error = NULL;
CvmHandle keys = cvm_keys_generate(&error);

char *public_key = cvm_keys_public_key(keys, &error);
cvm_string_free(public_key);

cvm_keys_free(keys);
```

Errors are opaque. Use `cvm_error_code`, `cvm_error_message`, and `cvm_error_free` to inspect and release them.

Mode fields in `CvmServerConfig` and `CvmClientConfig` are raw `int32_t` values. Set them with the `CVM_ENCRYPTION_*` and `CVM_GIFTWRAP_*` constants; invalid values are rejected with `CVM_VALIDATION`.

## JSON arguments

Several parity APIs use JSON strings to represent SDK values that are not portable C structs:

- `profile_metadata_json`: a `ProfileMetadata` JSON object.
- `*_publish_tools/resources/prompts/resource_templates`: a JSON array of MCP capability objects.
- `*_set_announcement_*_tags`: a JSON array of Nostr tag arrays, for example `[["pricing","free"]]`.

## Memory management

Rust-owned values returned through the C ABI must be released by the caller:

| Value                 | Release call                |
| --------------------- | --------------------------- |
| Strings               | `cvm_string_free`           |
| Messages              | `cvm_message_free`          |
| Incoming requests     | `cvm_incoming_request_free` |
| Announcement arrays   | `cvm_announcements_free`    |
| Discovered tool arrays | `cvm_discovered_tools_free` |
| Provider profile arrays | `cvm_provider_profiles_free` |
| Errors                | `cvm_error_free`            |

## Python binding surface

The generated `contextvm_ffi.py` exposes these top-level helpers and objects:

| Category | Names |
| -------- | ----- |
| Functions | `version()`, `pubkey_hex_to_npub(hex)`, `make_request(id, method, params)`, `make_response(id, result)`, `make_notification(method, params)` |
| Objects | `Keys`, `RelayPool`, `Discovery`, `Server`, `Client`, `Gateway`, `Proxy` |
| Configs | `ServerConfig(...)`, `ClientConfig(...)` (keyword-only fields) |
| Enums | `EncryptionMode.{OPTIONAL,REQUIRED,DISABLED}`, `GiftWrapMode.{OPTIONAL,EPHEMERAL,PERSISTENT}` |
| Records | `JsonRpcMessage`, `IncomingRequest`, `ServerAnnouncement`, `DiscoveredTool`, `ProviderProfile`, `PeerCapabilities` |

All async SDK work runs on an internal Tokio runtime, so every method is **blocking** — no `async`/`await` needed on the Python side.

Runnable Python examples ship in `examples/python/` of the SDK repository:

- `01_offline_check.py` — offline install sanity check (no network)
- `discover_servers.py` — server and tool discovery (mirrors `discovery.rs`)
- `proxy_tools_list.py` — client `tools/list` caller (mirrors `proxy.rs`)

See the SDK repository's `contextvm-ffi/src/uniffi_types.rs` for the full, authoritative API.

## Related documentation

- [Overview](/reference/rs-sdk/overview)
- [Gateway](/reference/rs-sdk/gateway)
- [Proxy](/reference/rs-sdk/proxy)
- [Discovery](/reference/rs-sdk/discovery)

---

_This page was ported from the [ContextVM Rust SDK repository](https://github.com/ContextVM/rs-sdk/tree/main/contextvm-ffi/README.md)._
