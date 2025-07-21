---
title: Constants
description: A set of constants used throughout the @contextvm/sdk.
---

# Constants

The `@contextvm/sdk` exports a set of constants that are used throughout the library for event kinds, tags, and other protocol-specific values. These constants ensure consistency and alignment with the ContextVM specification.

## Event Kinds

The ContextVM protocol defines several Nostr event kinds for different types of messages.

| Constant                      | Kind  | Description                                                                   |
| ----------------------------- | ----- | ----------------------------------------------------------------------------- |
| `CTXVM_MESSAGES_KIND`         | 25910 | The kind for standard, ephemeral ContextVM messages.                          |
| `GIFT_WRAP_KIND`              | 1059  | The kind for encrypted messages, wrapped using the NIP-59 gift wrap standard. |
| `SERVER_ANNOUNCEMENT_KIND`    | 11316 | A replaceable event for announcing a server's presence and basic info.        |
| `TOOLS_LIST_KIND`             | 11317 | A replaceable event for listing a server's available tools.                   |
| `RESOURCES_LIST_KIND`         | 11318 | A replaceable event for listing a server's available resources.               |
| `RESOURCETEMPLATES_LIST_KIND` | 11319 | A replaceable event for listing a server's available resource templates.      |
| `PROMPTS_LIST_KIND`           | 11320 | A replaceable event for listing a server's available prompts.                 |

## Nostr Tags

The SDK defines an object `NOSTR_TAGS` that contains constants for the various Nostr event tags used in the ContextVM protocol.

| Key                  | Tag                  | Description                                                            |
| -------------------- | -------------------- | ---------------------------------------------------------------------- |
| `PUBKEY`             | `p`                  | The public key of the message recipient.                               |
| `EVENT_ID`           | `e`                  | The event ID used to correlate requests and responses.                 |
| `CAPABILITY`         | `cap`                | A tag for specifying pricing metadata for a tool, resource, or prompt. |
| `NAME`               | `name`               | The human-readable name of a server in an announcement.                |
| `WEBSITE`            | `website`            | The URL of a server's website in an announcement.                      |
| `PICTURE`            | `picture`            | The URL of a server's icon in an announcement.                         |
| `SUPPORT_ENCRYPTION` | `support_encryption` | A tag indicating that a server supports end-to-end encryption.         |

## Announcement Methods

The `announcementMethods` object maps capability types to their corresponding MCP method names for server announcements.

```typescript
export const announcementMethods = {
  server: "initialize",
  tools: "tools/list",
  resources: "resources/list",
  resourceTemplates: "resources/templates/list",
  prompts: "prompts/list",
} as const;
```

This object is used internally by the `NostrServerTransport` to construct announcement events.

## Next Steps

With a solid understanding of the core modules, you are now ready to explore the **[Transports](/transports/base-nostr-transport)**, which are responsible for all network communication in the SDK.
