---
title: CEP-6 Public Server Announcements
description: Public server discovery mechanism for ContextVM capabilities
---

# Public Server Announcements

**Status:** Final
**Author:** @contextvm-org
**Type:** Standards Track

## Abstract

This CEP proposes a public server discovery mechanism for ContextVM using Nostr replaceable events. The mechanism allows MCP servers to advertise their capabilities and metadata through the Nostr network, enabling clients to discover and browse available services without requiring prior knowledge of server public keys. This enhances discoverability while maintaining the decentralized nature of the protocol.

This CEP also defines the discovery tag set that servers MAY replay on the first direct response sent to a client session. Public announcements remain the canonical public discoverability mechanism, while direct-response replay improves interoperability for stateless or announcement-agnostic clients.

## Specification

### Overview

Public server announcements act as a service catalog, allowing clients or users to discover servers and their capabilities through replaceable events on the Nostr network. This mechanism provides an initial overview of what a server offers, and their public keys to connect with them.

Since each server is uniquely identified by its public key, the announcement events are replaceable (kinds 11316-11320), ensuring that only the most recent version of the server's information is active.

Providers announce their servers and capabilities by publishing events with kinds 11316 (server), 11317 (tools/list), 11318 (resources/list), 11319 (resource templates/list), and 11320 (prompts/list).

The `11316` server announcement defines the standard discovery tags for a server. Those same tags MAY be replayed on the first direct response sent by the server to a client.

**Note:** The examples below present the `content` as a JSON object for readability; it must be stringified before inclusion in a Nostr event.

### Event Kinds for Server Announcements

| Kind  | Description             |
| ----- | ----------------------- |
| 11316 | Server Announcement     |
| 11317 | Tools List              |
| 11318 | Resources List          |
| 11319 | Resource Templates List |
| 11320 | Prompts List            |

### Server Announcement Event

```json
{
  "kind": 11316,
  "pubkey": "<provider-pubkey>",
  "content": {
    "protocolVersion": "2025-07-02",
    "capabilities": {
      "prompts": {
        "listChanged": true
      },
      "resources": {
        "subscribe": true,
        "listChanged": true
      },
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    },
    "instructions": "Optional instructions for the client"
  },
  "tags": [
    ["name", "Example Server"], // Optional: Human-readable server name
    ["about", "Server description"], // Optional: Server description
    ["picture", "https://example.com/server.png"], // Optional: Server icon/avatar URL
    ["website", "https://example.com"], // Optional: Server website
    ["support_encryption"] // Optional: Presence indicates server supports encrypted messages
  ]
}
```

#### Content Field Structure

The `content` field contains structured server information following the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle#initialization), it should be a JSON string.

#### Tags Field Structure

The `tags` field provides additional metadata for discoverability:

- **name**: Human-readable server name
- **about**: Server description
- **picture**: URL to server icon/avatar
- **website**: Server website URL
- **support_encryption**: Indicates server supports encrypted messages

These discovery tags are not limited to public announcement events. Servers MAY also include the same standard and custom discovery tags on the first direct response sent to a client session so that stateless clients can learn server metadata and transport capabilities without first fetching public announcements.

When discovery tags are observed on a direct server response:

- Clients SHOULD treat them as semantically equivalent to the same tags on the public server announcement
- Servers SHOULD include the full discovery tag set they want the client to learn on the first direct response of a session
- Custom discovery tags MAY be included and SHOULD be preserved by clients even when they are not interpreted by the SDK

Because direct-response replay is session-scoped, it does not replace public announcements for indexing, browsing, or relay-based discovery.

### Capability List Announcements

As in the Server Announcement event, the `content` field contains a JSON string with the list of capabilities. The list is the result of a call to the `list` method of each capability.

**Note**: For tools list announcements (kind 11317), see [CEP-15: Common Tool Schemas](/spec/ceps/cep-15) for additional tag conventions that enable schema discovery and ecosystem integration.

### Tools List Event Example

```json
{
  "kind": 11317,
  "pubkey": "<provider-pubkey>",
  "content": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather information for a location",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name or zip code"
            }
          },
          "required": ["location"]
        }
      }
    ]
  },
  "tags": []
}
```

### Discovery Process

#### Client Discovery Flow

1. **Subscribe to Server Announcement**: Clients subscribe to kind `11316` server announcements on Nostr relays
2. **Subscribe to Capability List Announcements**: Once the server announcement is fetched and parsed, the client can subscribe to the capability events referenced by the server's public metadata model
3. **Initialize Connection**: Client proceeds with standard MCP initialization using the server's public key

An alternative flow is to subscribe to all announcement events published by the server public key and fetch the public metadata in one step, instead of first fetching the server announcement and then fetching the capability lists.

For stateless or announcement-agnostic clients, implementations MAY also learn the same discovery tags from the first direct server response they receive. This direct-response replay is complementary to public discovery and does not replace announcements as the canonical public advertisement mechanism.

Clients that observe both public announcements and direct-response replay SHOULD treat them as two delivery paths for the same discovery tag vocabulary.

### Event Replacement Behavior

Since announcement events use kinds 11316-11320 (in the 10000-20000 range), they are replaceable:

- **Relay Behavior**: Relays store only the latest event for each combination of kind, and pubkey
- **Client Behavior**: Clients SHOULD always request the latest version of announcement events
- **Server Behavior**: Servers MUST update announcement events when capabilities change

## Reference Implementation

A reference implementation can be found in the [ContextVM SDK server transport implementation](https://github.com/ContextVM/sdk/blob/master/src/transport/nostr-server-transport.ts). It is implemented by calling the list methods from the transport during the initialization of the transport and then publishing the results of those list methods.

## Dependencies

- [CEP-4: Encryption Support](/spec/ceps/cep-4)
- [CEP-15: Common Tool Schemas](/spec/ceps/cep-15) — Extends tools list announcements with schema discovery and NIP-73 integration
