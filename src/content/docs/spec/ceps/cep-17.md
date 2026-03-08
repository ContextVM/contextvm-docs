---
title: CEP-17 Server Relay List Metadata
description: Relay list publication mechanism for ContextVM servers using NIP-65 conventions
---

# Server Relay List Metadata

**Status:** Draft
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes a relay list metadata mechanism for ContextVM servers using NIP-65 conventions. Servers can publish the relays they are reachable on using `kind:10002` events, allowing clients to discover the appropriate relays for establishing connections. This solves the current limitation where users must know both a server's public key and its relay URLs to connect.

## Specification

### Overview

ContextVM servers publish their relay list metadata using NIP-65 `kind:10002` replaceable events. These events contain `r` tags specifying the relay URLs the server uses, with optional markers indicating whether the relay is used for reading (receiving client requests) or writing (publishing responses).

### Event Structure

The relay list event uses the NIP-65 event format:

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

The `r` tag values are relay URLs. ContextVM's recommended profile is to publish **unmarked** relay tags, meaning the same relay is used for both inbound and outbound communication.

| Marker | Meaning |
|--------|---------|
| (none) | Relay is used for both reading and writing |
| `read` | Relay is intended primarily for inbound requests |
| `write` | Relay is intended primarily for outbound responses |

#### Recommended ContextVM Profile

- Servers SHOULD publish unmarked `r` tags by default
- Clients SHOULD treat unmarked relays as the normal operational relay set
- `read` and `write` markers MAY be used for advanced or specialized deployments, but they are not the recommended default for ContextVM

This keeps the mental model simple: a relay listed in `kind:10002` is, by default, a relay the client can both publish to and subscribe on.

### Server Behavior

#### Publishing Requirements

1. **Public servers** SHOULD publish a relay list event
2. **Private servers** MAY publish a relay list at their discretion
3. Servers MUST use the same pubkey for relay list events as their server announcements and operational events
4. Servers SHOULD publish a small set of unmarked operational relays unless they have a specific reason to use directional markers

#### Update Behavior

Since `kind:10002` is a replaceable event (10000-20000 range):

- Servers SHOULD update their relay list when their relay configuration changes
- Relays store only the latest event for each pubkey
- Clients SHOULD always request the latest version when discovering a server

#### Recommended Publication Lifecycle

- When updating a relay list, servers SHOULD publish the new `kind:10002` event to all relays in the new list and, when still reachable, to relays that were removed from the previous list
- This helps clients querying either the old or new relay set obtain the latest relay list during relay migrations or partial network fragmentation
- Servers SHOULD also publish their relay list to one or more widely used relays for bootstrapping and discoverability, even when those relays are not included in the published relay list itself

#### Bootstrap Relay Publication

Bootstrap relays are publication targets used to improve discoverability. They are distinct from the relay URLs advertised in the `kind:10002` event:

- **Advertised relay URLs** tell clients where the server can actually be reached
- **Bootstrap relay URLs** are extra relays where the server publishes its discoverability events
- A bootstrap relay MAY be omitted from the published relay list if the server does not intend clients to use it as an operational relay

This distinction lets servers keep their operational relay list minimal while still distributing `kind:10002` and `kind:11316` discoverability events broadly.

### Client Behavior

#### Discovery Flow

1. **Server Discovery**: Client discovers a server's pubkey via server announcements or out-of-band
2. **Relay List Fetch**: Client queries `kind:10002` events from the server's pubkey, often from the same relays where discoverability announcements are published
3. **Connection Establishment**: Client connects to the advertised operational relays, which in the recommended ContextVM profile are unmarked relays suitable for both sending requests and receiving responses

#### Relay Selection

When a server has multiple relays:

- Clients SHOULD prefer unmarked relays first
- Clients SHOULD connect to at least one advertised operational relay to send requests and receive responses
- For best reliability, clients MAY connect to a small number of additional advertised operational relays
- If directional markers are present, clients MAY use them as compatibility hints, but they SHOULD NOT be required for normal ContextVM interoperability

### Size Recommendations

Following NIP-65 guidance:

- Servers SHOULD keep relay lists small (commonly 2-4 operational relays)
- Excessive relay lists may be ignored by clients concerned with connection overhead
- Servers SHOULD prioritize their most reliable and well-connected relays

### Relationship to Server Announcements

The relay list event complements the server announcement (kind 11316):

| Event Kind | Purpose |
|------------|---------|
| 11316 | Advertises server capabilities, protocol version, and metadata |
| 10002 | Advertises where (which relays) the server can be reached |

Servers SHOULD publish their kind 10002 relay list to the same relays where they publish their kind 11316 announcement, ensuring discoverability. In implementations that support bootstrap relays, both discoverability event types SHOULD be published to the same bootstrap targets.

## Backward Compatibility

This CEP introduces no breaking changes:

- **Existing servers** continue to work without modification - relay list publication is optional at the protocol level
- **Existing clients** can continue using hardcoded relay URLs or other discovery mechanisms
- **New clients** can leverage relay list events when available, falling back to other methods when absent

Servers that do not publish a relay list event are treated the same as before - clients must obtain relay information through other means.

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6) - Server announcements (kind 11316) provide the pubkey needed to query relay lists

## Reference Implementation

A reference implementation is available in the [ContextVM SDK](https://github.com/ContextVM/sdk).
