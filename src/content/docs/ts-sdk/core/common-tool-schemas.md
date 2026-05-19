---
title: Common Tool Schemas
description: Compute and publish CEP-15 common tool schema hashes with the @contextvm/sdk.
---

# Common Tool Schemas

The `@contextvm/sdk` includes helpers for [CEP-15](/spec/ceps/cep-15) common tool schemas.

For most server integrations, prefer `withCommonToolSchemas()`. It decorates `NostrServerTransport` and publishes the required metadata automatically.

Use the lower-level utilities on this page when you need to precompute hashes, verify compatibility, or assert schema stability in tests or other scenarios.

## Recommended usage

The usual integration point is `withCommonToolSchemas()`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  NostrServerTransport,
  PrivateKeySigner,
  withCommonToolSchemas,
} from '@contextvm/sdk';

const server = new McpServer({
  name: 'translation-server',
  version: '1.0.0',
});

server.registerTool(
  'translate_text',
  {
    description: 'Translate text between languages.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        target_language: { type: 'string' },
      },
      required: ['text', 'target_language'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        translated_text: { type: 'string' },
      },
      required: ['translated_text'],
    },
  },
  async ({ text, target_language }) => ({
    content: [{ type: 'text', text: `Translated to ${target_language}: ${text}` }],
    structuredContent: {
      translated_text: `Translated to ${target_language}: ${text}`,
    },
  }),
);

const transport = withCommonToolSchemas(
  new NostrServerTransport({
    signer: new PrivateKeySigner('your-server-private-key'),
    relayHandler: ['wss://relay.damus.io'],
    isAnnouncedServer: true,
  }),
  {
    tools: [{ name: 'translate_text' }],
    categories: ['translation', 'language-tools'],
  },
);

await server.connect(transport);
```

This is the recommended path because the SDK will automatically:

- compute the CEP-15 schema hash;
- inject `_meta['io.contextvm/common-schema'].schemaHash` into `tools/list` results;
- add matching `i` and `k` tags to announced tools lists;
- add optional CEP-15 `t` tags for announcement-level categories when `categories` are configured.

`categories` are lightweight discoverability hints for announced `tools/list` events. The SDK trims whitespace, removes empty values, and deduplicates repeated categories while preserving the original order of the remaining entries.

For more transport-specific context, see [Nostr Server Transport](/ts-sdk/transports/nostr-server-transport#cep-15-common-tool-schemas).

## Exports

The SDK exports:

- `computeCommonSchemaHash()`
- `normalizeSchema()`
- `COMMON_SCHEMA_META_NAMESPACE`

## Schema normalization

`normalizeSchema()` removes documentation-only fields that do not participate in CEP-15 schema identity.

This includes:

- `title`
- `description`
- `examples`
- `default`
- `deprecated`
- `readOnly`
- `writeOnly`
- vendor extension keys starting with `x-`

The resulting normalized schema is then suitable for deterministic hashing.

## Computing a schema hash

```typescript
import { computeCommonSchemaHash } from '@contextvm/sdk';

const schemaHash = computeCommonSchemaHash({
  name: 'translate_text',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Input text' },
      target_language: { type: 'string', title: 'Target language' },
    },
    required: ['text', 'target_language'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      translated_text: { type: 'string' },
    },
    required: ['translated_text'],
  },
});
```

The hash is computed from:

- the tool `name`;
- the normalized `inputSchema`;
- the normalized `outputSchema`, when present.

## Manual verification

If you need to verify a schema hash yourself, compute it from the tool definition and compare it against `_meta['io.contextvm/common-schema'].schemaHash`.

```typescript
import {
  COMMON_SCHEMA_META_NAMESPACE,
  computeCommonSchemaHash,
} from '@contextvm/sdk';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

function hasMatchingSchemaHash(tool: Tool): boolean {
  const expectedHash = computeCommonSchemaHash({
    name: tool.name,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
  });

  return (
    tool._meta?.[COMMON_SCHEMA_META_NAMESPACE]?.schemaHash === expectedHash
  );
}
```

This is mainly useful for tests, debugging, and custom verification flows.

## Constraints

- Tool `name` is part of the hash.
- `outputSchema` affects the hash when present.
- Schemas must be self-contained before hashing.
- Remote `$ref` values are not supported during hash computation and must be resolved in advance.

## Next Steps

For the recommended server-side integration, see [Nostr Server Transport](/ts-sdk/transports/nostr-server-transport#cep-15-common-tool-schemas).
