---
title: CEP-TBD Common Tool Schemas
description: Standard for defining and discovering common tool schemas using MCP _meta fields and ContextVM announcements
---

# Common Tool Schemas

**Status:** Draft  
**Type:** Standards Track

## Abstract

This CEP establishes a standard for defining and discovering common tool schemas in ContextVM. It enables interoperability by allowing multiple servers to implement standardized tool interfaces that clients can recognize and use consistently. Using MCP's `_meta` field, RFC 8785 for deterministic hashing, and CEP-6 announcements for discovery, this creates a marketplace where users can choose between multiple providers implementing the same standard tool interface.

## Motivation

This CEP enables a **marketplace for common services** in ContextVM. When servers implement similar functionality (e.g., translation, weather, search), clients currently cannot:

1. Discover equivalent services across providers
2. Switch providers without code changes
3. Compare offerings based on quality, cost, or trust
4. Build specialized UIs for standard tool types

Common tool schemas enable provider competition, user choice, client optimization, and seamless interoperability.

## Specification

### 1. Hash Calculation Strategy

To ensure that semantically identical tool definitions produce the same cryptographic fingerprint, this specification uses **RFC 8785 (JSON Canonicalization Scheme - JCS)** for deterministic JSON serialization.

#### Hash Construction

The schema hash is calculated as:

```javascript
schemaHash = sha256(JCS({
  name: string,
  inputSchema: JSONSchema,
  outputSchema?: JSONSchema
}))
```

**Important**: The hash includes the tool name to ensure interoperability. Since MCP tool invocations use the tool name in requests, including it in the hash guarantees that clients can use the same tool name across all servers implementing the common schema.

**Note**: The `description` field is intentionally excluded from the hash to allow implementers freedom in how they describe their service while maintaining schema compatibility.

#### Example Hash Calculation

```javascript
import { canonicalize } from "json-canonicalize";
import { createHash } from "crypto";

const toolSchema = {
  name: "translate_text",
  inputSchema: {
    /* schema definition */
  },
  outputSchema: {
    /* optional schema */
  },
};

const hash = createHash("sha256")
  .update(canonicalize(toolSchema))
  .digest("hex");
```

### 2. Reference Server Pattern

A **reference server** defines a canonical tool schema. The schema is uniquely identified by `(serverPubkey, toolName)`.

#### Tool Definition in `tools/list` Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "translate_text",
        "description": "Translate text between languages using AI models",
        "inputSchema": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text to translate"
            },
            "source_language": {
              "type": "string",
              "description": "Source language code (ISO 639-1)"
            },
            "target_language": {
              "type": "string",
              "description": "Target language code (ISO 639-1)"
            }
          },
          "required": ["text", "target_language"]
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "translated_text": {
              "type": "string",
              "description": "The translated text"
            },
            "detected_language": {
              "type": "string",
              "description": "Detected source language if not provided"
            }
          },
          "required": ["translated_text"]
        },
        "_meta": {
          "io.contextvm/common-schema": {
            "schemaHash": "a7f3d9c2b1e8..."
          }
        }
      }
    ]
  }
}
```

#### In CEP-6 Public Announcements

Reference servers include a `D` tag for discovery:

```json
{
  "kind": 11317,
  "pubkey": "<reference-server-pubkey>",
  "tags": [["D", "a7f3d9c2b1e8...", "translate_text"]]
}
```

**Tag Format**: `["D", "<schema-hash>", "<tool-name>"]` - Indicates this server defines a common tool schema.

### 3. Implementing Server Pattern

An **implementing server** provides a tool conforming to a reference schema. Implementers MUST match the reference `inputSchema` exactly and SHOULD include `outputSchema` if present.

#### Tool Definition in `tools/list` Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "translate_text",
        "description": "Translation powered by OpenAI GPT-4",
        "inputSchema": {
          // MUST match reference schema exactly
        },
        "outputSchema": {
          // SHOULD match reference schema if present
        },
        "_meta": {
          "io.contextvm/common-schema": {
            "implements": {
              "serverPubkey": "npub1ref...",
              "toolName": "translate_text",
              "schemaHash": "a7f3d9c2b1e8..."
            }
          }
        }
      }
    ]
  }
}
```

**Key Points**:

- Tool **name MUST match** the reference for interoperability
- **Other fields MAY differ** for implementation details
- **Schemas MUST match exactly** (outputSchema SHOULD match if present)
- `_meta` field contains `implements` object with reference details

#### In CEP-6 Public Announcements

Implementing servers include an `I` tag:

```json
{
  "kind": 11317,
  "pubkey": "<implementing-server-pubkey>",
  "tags": [["I", "a7f3d9c2b1e8...", "npub1ref...", "translate_text"]]
}
```

**Tag Format**: `["I", "<schema-hash>", "<ref-server-pubkey>", "<tool-name>"]` - Indicates this server implements a common tool schema.

### 4. Discovery and Verification Flow

#### Server Discovery

**Find reference servers:**

```json
{ "kinds": [11317], "#D": ["a7f3d9c2b1e8..."] }
```

**Find all implementers:**

```json
{ "kinds": [11317], "#I": ["a7f3d9c2b1e8..."] }
```

#### Verification Process

1. Receive `tools/list` response
2. Extract tool name, inputSchema, and outputSchema
3. Compute hash: `sha256(JCS({name, inputSchema, outputSchema}))`
4. Compare with `_meta["io.contextvm/common-schema"].schemaHash` (or `.implements.schemaHash`)
5. If hashes match, the tool conforms to the common schema

#### Client Tool Invocation

Once verified, clients invoke tools using the standard name:

```json
{
  "method": "tools/call",
  "params": {
    "name": "translate_text",
    "arguments": { "text": "Hello!", "target_language": "es" }
  }
}
```

Works identically across all implementing servers.

### 5. The `_meta` Field Structure

**Reference servers**:

```typescript
{
  "_meta": {
    "io.contextvm/common-schema": {
      "schemaHash": string  // SHA-256 hash
    }
  }
}
```

**Implementing servers**:

```typescript
{
  "_meta": {
    "io.contextvm/common-schema": {
      "implements": {
        "serverPubkey": string,  // Reference server npub
        "toolName": string,      // Tool name
        "schemaHash": string     // SHA-256 hash
      }
    }
  }
}
```

### 6. Versioning

Common tool schemas do **not** have independent versions. Version information comes from the server, following MCP's design where servers have versions, not individual tools.

When a schema needs breaking changes:

1. Define a new tool with a different name (e.g., `translate_text_v2`)
2. Or update in a new server version

The server version in initialization responses indicates the overall API version.

## Backward Compatibility

Fully backward compatible:

- Existing clients ignore `_meta` and use tools normally
- Existing servers work without `_meta` fields
- `_meta` is part of the MCP specification
- CEP-6 tags are additive

## Security Implications

### Schema Verification

**Risk**: A malicious server could claim to implement a common schema but provide different, potentially harmful schemas.

**Mitigation**:

- Clients MUST verify the schema hash before trusting a common schema claim
- Clients SHOULD display clear warnings if hash verification fails
- Clients MAY maintain a list of trusted reference servers

### Server Impersonation

**Risk**: An attacker could claim to be a reference server by using fake announcements.

**Mitigation**:

- All events are cryptographically signed with the server's private key
- Clients verify event signatures using Nostr's built-in signature verification
- Server public keys serve as persistent identities that users can verify and trust

### Schema Discovery

**Risk**: Users might discover and connect to untrusted servers implementing common schemas.

**Mitigation**:

- Clients SHOULD implement server reputation systems
- Clients SHOULD allow users to maintain allowlists of trusted servers
- Discovery doesn't equal trust—users must explicitly authorize connections

## Implementation Considerations

### For Server Developers

**Defining a schema**: Choose a clear name, design comprehensive schemas, calculate the hash, include in `_meta`, and publish with `D` tag.

**Implementing a schema**: Find reference servers, match the tool name exactly, verify schemas match via hash, include `implements` metadata, and publish with `I` tag.

### For Client Developers

**Discovery**: Query Nostr for `I` tags, present provider options, allow filtering by reputation/cost/features.

**Verification**: Always verify schema hashes, show clear indicators for verified schemas, warn on failures.

**UX**: Build specialized UIs for common schemas, enable provider switching, cache verified schemas.

## Example: Weather Service Marketplace

### 1. Reference Server Defines Schema

```json
{
  "name": "get_weather",
  "inputSchema": {
    "properties": {
      "location": { "type": "string" }
    },
    "required": ["location"]
  },
  "outputSchema": {
    "properties": {
      "temperature": { "type": "number" }
    },
    "required": ["temperature"]
  },
  "_meta": {
    "io.contextvm/common-schema": {
      "schemaHash": "f8e7d6c5b4a3..."
    }
  }
}
```

**Announcement**: `["D", "f8e7d6c5b4a3...", "get_weather"]`

### 2. Implementing Servers Join

```json
{
  "name": "get_weather",
  "_meta": {
    "io.contextvm/common-schema": {
      "implements": {
        "serverPubkey": "npub1weather...",
        "toolName": "get_weather",
        "schemaHash": "f8e7d6c5b4a3..."
      }
    }
  }
}
```

**Announcement**: `["I", "f8e7d6c5b4a3...", "npub1weather...", "get_weather"]`

### 3. Client Discovers Providers

Filter: `{ "kinds": [11317], "#I": ["f8e7d6c5b4a3..."] }`
Or: `{ "kinds": [11317], "#D": ["f8e7d6c5b4a3..."] }` to discover reference server

### 4. User Invokes Tool

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "location": "San Francisco" }
  }
}
```

Works identically across all providers.

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://tools.ietf.org/html/rfc8785)
- [NIP-19: bech32-encoded entities](https://github.com/nostr-protocol/nips/blob/master/19.md)
- [MCP Specification: Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP Specification: \_meta field](https://modelcontextprotocol.io/specification/2025-11-25/basic#json-schema-usage)

## References

- [MCP Registry Ecosystem Vision](https://github.com/modelcontextprotocol/registry/blob/main/docs/design/ecosystem-vision.md)
- [MCP Registry API Specification](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md)
- [shadcn Registry Architecture](https://ui.shadcn.com/docs/registry/getting-started)
