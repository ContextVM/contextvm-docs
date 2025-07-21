---
title: PrivateKeySigner
description: A default signer implementation for the @contextvm/sdk.
---

# `PrivateKeySigner`

The `PrivateKeySigner` is the default implementation of the [`NostrSigner`](/signer/nostr-signer-interface) interface provided by the `@contextvm/sdk`. It is a straightforward and easy-to-use signer that operates directly on a raw private key provided as a hexadecimal string.

## Overview

The `PrivateKeySigner` is designed for scenarios where the private key is readily available in the application's environment. It handles all the necessary cryptographic operations locally, including:

- Deriving the corresponding public key.
- Signing Nostr events.
- Encrypting and decrypting messages using NIP-44.

## `constructor(privateKey: string)`

The constructor takes a single argument:

- **`privateKey`**: A hexadecimal string representing the 32-byte Nostr private key.

When instantiated, the `PrivateKeySigner` will immediately convert the hex string into a `Uint8Array` and derive the public key, which is then cached for future calls to `getPublicKey()`.

## Usage Example

```typescript
import { PrivateKeySigner } from "@ctxvm/sdk/signer";

// Replace with a securely stored private key
const privateKeyHex = "your-32-byte-private-key-in-hex";

const signer = new PrivateKeySigner(privateKeyHex);

// You can now pass this signer instance to a transport
const transportOptions = {
  signer: signer,
  // ... other options
};
```

## Key Methods

The `PrivateKeySigner` implements all the methods required by the `NostrSigner` interface.

### `async getPublicKey(): Promise<string>`

Returns a promise that resolves with the public key corresponding to the private key provided in the constructor.

### `async signEvent(event: UnsignedEvent): Promise<NostrEvent>`

Takes an unsigned Nostr event, signs it using the private key, and returns a promise that resolves with the finalized, signed `NostrEvent`.

### `nip44`

The `PrivateKeySigner` also provides a `nip44` object that implements NIP-44 encryption and decryption. This is used internally by the transports when encryption is enabled, and it allows the `decryptMessage` function to work seamlessly with this signer.

- `encrypt(pubkey, plaintext)`: Encrypts a plaintext message for a given recipient public key.
- `decrypt(pubkey, ciphertext)`: Decrypts a ciphertext message received from a given sender public key.

## Security Considerations

While the `PrivateKeySigner` is convenient, it requires you to handle a raw private key directly in your application code. **It is crucial to manage this key securely.** Avoid hard-coding private keys in your source code. Instead, use environment variables or a secure secret management system to load the key at runtime.

For applications requiring a higher level of security, consider creating a custom signer that interacts with a hardware wallet or a remote signing service.

## Next Steps

- Learn how to build a custom signer: **[Custom Signer Development](/signer/custom-signer-development)**
