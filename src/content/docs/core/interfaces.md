---
title: Interfaces
description: A deep dive into the core interfaces used in the @contextvm/sdk.
---

# Core Interfaces

The `@contextvm/sdk` is designed with a modular and extensible architecture, centered around a set of core interfaces. These interfaces define the essential components for signing, relay management, and communication.

## `NostrSigner`

The `NostrSigner` interface is fundamental for cryptographic operations within the SDK. It abstracts the logic for signing Nostr events, ensuring that all communications are authenticated and verifiable.

### Definition

```typescript
export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<NostrEvent>;

  // Optional NIP-04 encryption support (deprecated)
  nip04?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };

  // Optional NIP-44 encryption support
  nip44?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
}
```

Any object that implements this interface can be used to sign events, allowing you to integrate with various key management systems, such as web, hardware wallets or remote signing services. The SDK provides a default implementation, `PrivateKeySigner`, which signs events using a raw private key.

- **Learn more:** [`NostrSigner` Deep Dive](/contextvm-docs/signer/nostr-signer-interface/)
- **Default Implementation:** [`PrivateKeySigner`](/contextvm-docs/signer/private-key-signer/)

## `RelayHandler`

The `RelayHandler` interface manages interactions with Nostr relays. It is responsible for subscribing to events and publishing events to the Nostr network.

### Definition

```typescript
export interface RelayHandler {
  connect(): Promise<void>;
  disconnect(relayUrls?: string[]): Promise<void>;
  publish(event: NostrEvent): Promise<void>;
  subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
  ): Promise<void>;
  unsubscribe(): void;
}
```

By implementing this interface, you can create custom relay management logic, such as sophisticated relay selection strategies or custom reconnection policies. The SDK includes `SimpleRelayPool` as a default implementation.

- **Learn more:** [`RelayHandler` Deep Dive](/contextvm-docs/relay/relay-handler-interface)
- **Default Implementation:** [`SimpleRelayPool`](/contextvm-docs/relay/simple-relay-pool)

## `EncryptionMode`

The `EncryptionMode` enum defines the encryption policy for a transport.

```typescript
export enum EncryptionMode {
  OPTIONAL = "optional",
  REQUIRED = "required",
  DISABLED = "disabled",
}
```

This enum is used to configure the encryption behavior of the `NostrClientTransport` and `NostrServerTransport`.

- **Learn more:** [Encryption](/contextvm-docs/core/encryption)

## `AnnouncementMethods`

The `AnnouncementMethods` interface defines methods for announcing server capabilities on the Nostr network.

```typescript
export interface AnnouncementMethods {
  server: InitializeRequest["method"];
  tools: ListToolsRequest["method"];
  resources: ListResourcesRequest["method"];
  resourceTemplates: ListResourceTemplatesRequest["method"];
  prompts: ListPromptsRequest["method"];
}
```

This interface is used by the `NostrServerTransport` to publish server announcements.
