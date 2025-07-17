---
title: NostrSigner Interface
description: An interface for signing Nostr events.
---

# `NostrSigner` Interface

The `NostrSigner` interface is a central component of the `@contextvm/sdk`, defining the standard for cryptographic signing operations. Every Nostr event must be signed by a private key to be considered valid, and this interface provides a consistent, pluggable way to handle this requirement.

## Purpose and Design

The primary purpose of the `NostrSigner` is to abstract the process of event signing. By depending on this interface rather than a concrete implementation, the SDK's transports and other components can remain agnostic about how and where private keys are stored and used.

This design offers several key benefits:

-   **Security**: Private keys can be managed in secure environments (e.g., web extensions, hardware wallets, dedicated signing services) without exposing them to the application logic.
-   **Flexibility**: Developers can easily swap out the default signer with a custom implementation that meets their specific needs.
-   **Modularity**: The signing logic is decoupled from the communication logic, leading to a cleaner, more maintainable codebase.

## Interface Definition

The `NostrSigner` interface is defined in [`core/interfaces.ts`](../core/interfaces.md#nostrsigner).

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

-   `getPublicKey()`: Asynchronously returns the public key corresponding to the signer's private key.
-   `signEvent(event)`: Takes an unsigned Nostr event, signs it, and returns the signature.
-   `nip04`: (Deprecated) Provides NIP-04 encryption support.
-   `nip44`: Provides NIP-44 encryption support.

Any class that implements this interface can be used as a signer throughout the SDK.

## Implementations

The SDK provides a default implementation for common use cases and allows for custom implementations for advanced scenarios.

-   **[PrivateKeySigner](./private-key-signer.md)**: The default implementation, which takes a raw private key string and performs signing operations locally.
-   **[Custom Signer Development](./custom-signer-development.md)**: A guide to creating your own signer by implementing the `NostrSigner` interface.

## Next Steps

-   Learn about the default implementation: **[PrivateKeySigner](./private-key-signer.md)**
-   Learn how to create your own: **[Custom Signer Development](./custom-signer-development.md)**