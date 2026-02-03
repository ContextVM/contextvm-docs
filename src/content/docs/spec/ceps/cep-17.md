---
title: CEP-18 Server Relay List Metadata
description: Relay list publication mechanism for ContextVM servers using NIP-65 conventions
---

# Server Relay List Metadata

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes a relay list metadata mechanism for ContextVM servers using NIP-65 conventions. Servers can publish the relays they are connected to using `kind:10002` events, allowing clients to discover the appropriate relays for establishing connections. This solves the current limitation where users must know both a server's public key and its relay URLs to connect.

## Specification

### Overview

ContextVM servers publish their relay list metadata using NIP-65 `kind:10002` replaceable events. These events contain `r` tags specifying the relay URLs the server uses, with optional markers indicating whether the relay is used for reading (receiving client requests) or writing (publishing responses).

### Event Structure

The relay list event follows the NIP-65 specification exactly:

```json
{
  "kind": 10002,
  "pubkey": "<server-pubkey>",
  "content": "",
  "tags": [
    ["r", "wss://relay1.example.com"],
    ["r", "wss://relay2.example.com"],
    ["r", "wss://relay3.example.com", "write"],
    ["r", "wss://relay4.example.com", "read"]
  ],
  "created_at": 1234567890,
  // other fields...
}
```

### Tag Semantics

The `r` tag values are relay URLs. An optional third element specifies the relay's purpose:

| Marker | Meaning |
|--------|---------|
| (none) | Relay is used for both reading and writing |
| `read` | Server listens on this relay for client requests |
| `write` | Server publishes responses to this relay |

#### Marker Interpretation

- **`read` relays**: Where the server subscribes to incoming client messages (kind 25910 events targeting the server's pubkey)
- **`write` relays**: Where the server publishes its responses and announcements
- **No marker**: The server uses the relay for both purposes

### Server Behavior

#### Publishing Requirements

1. **Public servers** (those publishing kind 11316 announcements) SHOULD publish a relay list event
2. **Private servers** MAY publish a relay list at their discretion
3. Servers MUST use the same pubkey for relay list events as their server announcements and operational events

#### Update Behavior

Since `kind:10002` is a replaceable event (10000-20000 range):

- Servers SHOULD update their relay list when their relay configuration changes
- Relays store only the latest event for each pubkey
- Clients SHOULD always request the latest version when discovering a server

### Client Behavior

#### Discovery Flow

1. **Server Discovery**: Client discovers a server's pubkey via kind 11316 (Server Announcement) or out-of-band
2. **Relay List Fetch**: Client queries `kind:10002` events from the server's pubkey
3. **Connection Establishment**: Client connects to appropriate relays based on markers:
   - For sending requests: use `read` relays or relays with no marker
   - For receiving responses: subscribe on `write` relays or relays with no marker

#### Relay Selection

When a server has multiple relays:

- Clients SHOULD connect to at least one `read` relay (or unmarked relay) to send requests
- Clients SHOULD subscribe on at least one `write` relay (or unmarked relay) to receive responses
- For best reliability, clients MAY connect to multiple relays in each category

### Size Recommendations

Following NIP-65 guidance:

- Servers SHOULD keep relay lists small (2-4 relays per category)
- Excessive relay lists may be ignored by clients concerned with connection overhead
- Servers SHOULD prioritize their most reliable and well-connected relays

### Relationship to Server Announcements

The relay list event complements the server announcement (kind 11316):

| Event Kind | Purpose |
|------------|---------|
| 11316 | Advertises server capabilities, protocol version, and metadata |
| 10002 | Advertises where (which relays) the server can be reached |

Servers SHOULD publish their kind 10002 relay list to the same relays where they publish their kind 11316 announcement, ensuring discoverability. 

## Backward Compatibility

This CEP introduces no breaking changes:

- **Existing servers** continue to work without modification - relay list publication is optional
- **Existing clients** can continue using hardcoded relay URLs or other discovery mechanisms
- **New clients** can leverage relay list events when available, falling back to other methods when absent

Servers that do not publish a relay list event are treated the same as before - clients must obtain relay information through other means.

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6) - Server announcements (kind 11316) provide the pubkey needed to query relay lists

## Reference Implementation

A reference implementation will be added to the [ContextVM SDK](https://github.com/ContextVM/sdk) in the announcement manager to publish relay lists alongside server announcements.