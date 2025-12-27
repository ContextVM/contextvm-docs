---
title: CEP-TBD Common Tool Schemas
description: Standard for defining and discovering common tool schemas using MCP _meta fields and ContextVM announcements
---

# Common Tool Schemas

**Status:** Draft  
**Type:** Standards Track

## Abstract

This CEP establishes a standard for defining and discovering common tool schemas in ContextVM.

It enables interoperability by allowing multiple servers to implement the same standardized MCP tool interface that clients can recognize and use consistently. Using MCP's `_meta` field, RFC 8785 for deterministic hashing, and CEP-6 announcements for discovery, this creates a marketplace where users can choose between multiple providers implementing the same common tool schema.

## Motivation

This CEP enables a **marketplace for common services** in ContextVM. When servers implement similar functionality (e.g., translation, weather, search), clients currently cannot:

1. Discover equivalent services across providers
2. Switch providers without code changes
3. Compare offerings based on quality, cost, or trust
4. Build specialized UIs for standard tool types

Common tool schemas enable provider competition, user choice, client optimization, and seamless interoperability.

## Specification

### 1. Schema identity and hash calculation

A common tool schema is identified by a **deterministic hash** of its tool name and JSON Schemas.

To ensure semantically identical tool definitions produce the same cryptographic fingerprint, this specification uses **RFC 8785 (JSON Canonicalization Scheme — JCS)** for deterministic JSON serialization.

#### 1.1 Hash construction

The schema hash is calculated as:

```javascript
schemaHash = sha256(JCS({
  name: string,
  inputSchema: JSONSchema,
  outputSchema?: JSONSchema
}))
```

**Important**: The hash includes the tool name to ensure interoperability. Since MCP tool invocations use the tool name in requests, including it in the hash guarantees that clients can use the same tool name across all servers implementing the common schema.

**Important**: If `outputSchema` is present, it **MUST** be included in the hashed payload.

**Note**: The `description` and `title` fields are intentionally excluded from the hash to allow implementers freedom in how they describe their service while maintaining schema compatibility.

**Note (output schema omission)**: Servers that do not provide an `outputSchema` will naturally share a hash with other servers that also omit `outputSchema` but use the same `name` and `inputSchema`. This is not inherently unsafe, but it can reduce specificity when clients want to distinguish between tools that return structured output vs. tools that return unstructured output.

#### 1.2 Example hash calculation

```javascript
import { canonicalize } from "json-canonicalize";
import { createHash } from "crypto";

const toolSchema = {
  name: "translate_text",
  inputSchema: {
    /* schema definition */
  },
  outputSchema: {
    /* optional schema (if present, MUST be included in the hash) */
  },
};

const hash = createHash("sha256")
  .update(canonicalize(toolSchema))
  .digest("hex");
```

### 2. Tool metadata (`_meta`) in `tools/list`

Servers that implement a common tool schema MUST include the schema hash in the MCP tool definition using MCP's `_meta` field.

**Multi-tool servers**: Common schemas are defined **per tool**. A server that exposes multiple tools MUST include the appropriate `schemaHash` in each tool entry it wants treated as a common schema. Tools that do not include this `_meta` field are simply treated as non-common (bespoke) tools.

#### 2.1 Tool definition in `tools/list` response

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

### 3. Public announcements (CEP-6) for discovery

Servers MAY publish CEP-6 public announcements to advertise which common tool schemas they implement.

This CEP uses a single announcement marker (`I`) to avoid introducing an “authoritative definer” concept. Schema identity comes solely from `schemaHash`.

#### 3.1 Implemented schema marker (`I` tag)

Servers implementing a common tool schema include an `I` tag:

```json
{
  "kind": 11317,
  "pubkey": "<server-pubkey>",
  "tags": [["I", "a7f3d9c2b1e8...", "translate_text"]]
}
```

**Tag format**: `["I", "<schema-hash>", "<tool-name>"]` — indicates this server implements the common schema identified by `<schema-hash>` for tool name `<tool-name>`.

**Multi-tool servers**: A server MAY announce multiple implemented common schemas by including multiple `I` tags in the same event (one per tool schema hash). For example:

```json
{
  "kind": 11317,
  "pubkey": "<server-pubkey>",
  "tags": [
    ["I", "a7f3d9c2b1e8...", "translate_text"],
    ["I", "f8e7d6c5b4a3...", "get_weather"]
  ]
}
```

This keeps schema discovery hash-indexable while allowing a single server announcement to represent a server with many tools.

#### 3.2 Optional category tags (`t` tags)

To support lightweight discoverability and curation, servers MAY include one or more `t` tags that categorize the server's tool offerings.

These tags are **not part of the schema contract** and are **not enforced**. They are hints for browsing and filtering.

Example:

```json
{
  "kind": 11317,
  "pubkey": "<server-pubkey>",
  "tags": [
    ["I", "a7f3d9c2b1e8...", "translate_text"],
    ["t", "translation"],
    ["t", "traduccion"]
  ]
}
```

**Recommendation**: Servers SHOULD include at least one canonical, English, slug-style category tag (e.g., `translation`, `weather-forecast`, `web-search`) to reduce fragmentation across languages and synonyms.

### 4. Discovery and verification flow

#### 4.1 Server discovery

**Find all implementers of a schema hash:**

```json
{ "kinds": [11317], "#I": ["a7f3d9c2b1e8..."] }
```

**Browse candidates by category (best-effort):**

```json
{ "kinds": [11317], "#t": ["translation"] }
```

Recommended client behavior is a two-step flow:

1. Browse/search using `t` tags (optional, best-effort)
2. For interoperable provider switching, rely on `schemaHash` by:
   - extracting the hash from announcements and/or `tools/list`, and
   - querying `#I` by hash to find other implementers

#### 4.2 Verification process

Clients SHOULD verify schema conformance before treating a tool as an implementation of a common schema.

1. Receive `tools/list` response
2. Extract tool `name`, `inputSchema`, and `outputSchema` (if present)
3. Compute hash: `sha256(JCS({ name, inputSchema, outputSchema? }))`
4. Compare with `_meta["io.contextvm/common-schema"].schemaHash`
5. If hashes match, the tool conforms to the common schema

#### 4.3 Client tool invocation

Clients invoke tools using the standard name:

```json
{
  "method": "tools/call",
  "params": {
    "name": "translate_text",
    "arguments": { "text": "Hello!", "target_language": "es" }
  }
}
```

Works identically across all implementing servers for the same schema hash.

### 5. The `_meta` field structure

Servers implementing a common tool schema MUST provide:

```typescript
{
  "_meta": {
    "io.contextvm/common-schema": {
      "schemaHash": string // SHA-256 hash
    }
  }
}
```

### 6. Versioning

Common tool schemas do **not** have independent versions. Version information comes from the server, following MCP's design where servers have versions, not individual tools.

Breaking changes naturally produce a new `schemaHash` (because the hashed payload changes). In practice, schema evolution can be handled by:

1. Defining a new tool with a different name (e.g., `translate_text_v2`)
2. Or updating the tool schema in a new server version (clients relying on hash-based common schemas will treat it as a different schema hash)

The server version in initialization responses indicates the overall API version.

## Backward Compatibility

Fully backward compatible:

- Existing clients ignore `_meta` and use tools normally
- Existing servers work without `_meta` fields
- `_meta` is part of the MCP specification
- CEP-6 tags are additive

## Security Implications

### Schema verification

**Risk**: A malicious server could claim to implement a common schema but provide different, potentially harmful schemas.

**Mitigation**:

- Clients MUST verify the schema hash before trusting a common schema claim
- Clients SHOULD display clear warnings if hash verification fails

### Discovery does not imply trust

**Risk**: Users might discover and connect to untrusted servers implementing common schemas.

**Mitigation**:

- Clients SHOULD implement server reputation systems
- Clients SHOULD allow users to maintain allowlists of trusted servers
- Discovery doesn't equal trust—users must explicitly authorize connections

## Implementation Considerations

### For server developers

**Implementing a common schema**:

- Choose a clear tool name (it is part of the hash)
- Design `inputSchema` and (optionally, but strongly recommended) `outputSchema`
- Compute `schemaHash` using JCS + SHA-256
- Include `schemaHash` in `_meta["io.contextvm/common-schema"].schemaHash`
- Publish a CEP-6 announcement with an `I` tag
- Optionally include `t` tags for categorization

### For client developers

**Discovery**:

- Query Nostr for `I` tags to find providers for a known `schemaHash`
- Optionally support browsing via `t` tags, then refine by hash

**Verification**:

- Always verify schema hashes
- Show clear indicators for verified schemas and warnings on failures

**UX**:

- Build specialized UIs for common schemas
- Enable provider switching by grouping providers by `schemaHash`
- Cache verified schemas

## Example: Weather service marketplace

### 1. A server implements the weather schema

`tools/list` includes the schema hash:

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

### 2. The server announces it implements the schema

```json
{
  "kind": 11317,
  "pubkey": "<server-pubkey>",
  "tags": [
    ["I", "f8e7d6c5b4a3...", "get_weather"],
    ["t", "weather-forecast"]
  ]
}
```

### 3. Client discovers providers

Find implementers:

```json
{ "kinds": [11317], "#I": ["f8e7d6c5b4a3..."] }
```

Or browse by category (best-effort):

```json
{ "kinds": [11317], "#t": ["weather-forecast"] }
```

### 4. User invokes tool

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "location": "San Francisco" }
  }
}
```

Works identically across all providers implementing the same schema hash.

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://tools.ietf.org/html/rfc8785)
- [MCP Specification: Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP Specification: \_meta field](https://modelcontextprotocol.io/specification/2025-11-25/basic#json-schema-usage)
