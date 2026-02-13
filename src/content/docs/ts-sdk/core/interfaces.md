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

- **Learn more:** [`NostrSigner` Deep Dive](/signer/nostr-signer-interface/)
- **Default Implementation:** [`PrivateKeySigner`](/signer/private-key-signer/)

## `RelayHandler`

The `RelayHandler` interface manages interactions with Nostr relays. It is responsible for subscribing to events and publishing events to the Nostr network.

### Definition

```typescript
export interface RelayHandler {
  connect(): Promise<void>;
  disconnect(relayUrls?: string[]): Promise<void>;
  publish(event: NostrEvent, opts?: { abortSignal?: AbortSignal }): Promise<void>;
  subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
  ): Promise<() => void>;
  unsubscribe(): void;
}
```

By implementing this interface, you can create custom relay management logic, such as sophisticated relay selection strategies or custom reconnection policies. The SDK includes `SimpleRelayPool` as a default implementation.

- **Learn more:** [`RelayHandler` Deep Dive](/relay/relay-handler-interface)
- **Default Implementation:** [`SimpleRelayPool`](/relay/simple-relay-pool)

## `EncryptionMode`

The `EncryptionMode` enum defines the encryption policy for a transport.

```typescript
export enum EncryptionMode {
  OPTIONAL = 'optional',
  REQUIRED = 'required',
  DISABLED = 'disabled',
}
```

This enum is used to configure the encryption behavior of the `NostrClientTransport` and `NostrServerTransport`.

- **Learn more:** [Encryption](/core/encryption)

## `ServerInfo`

The `ServerInfo` interface provides metadata about a server, used by the Nostr server transport to add metadata to server announcements.

### Definition

```typescript
export interface ServerInfo {
  name?: string;
  picture?: string;
  website?: string;
  about?: string;
}
```

This interface allows servers to include descriptive information in their announcements, making them more discoverable and providing users with context about the server's purpose and identity.

- **name**: A human-readable name for the server
- **picture**: URL to an image representing the server
- **website**: The server's official website or repository
- **about**: A description of the server's purpose or content
