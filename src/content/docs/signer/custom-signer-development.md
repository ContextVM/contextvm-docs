---
title: Custom Signer Development
description: Learn how to create a custom signer for the @contextvm/sdk.
---

# Custom Signer Development

One of the key design features of the `@contextvm/sdk` is its modularity, which is exemplified by the [`NostrSigner`](/contextvm-docs/signer/nostr-signer-interface) interface. By creating your own implementation of this interface, you can integrate the SDK with any key management system, such as a hardware wallet, a remote signing service (like an HSM), or a browser extension.

## Why Create a Custom Signer?

While the [`PrivateKeySigner`](/contextvm-docs/signer/private-key-signer) is a common choice for most applications, there are cases where you may need to use a different approach:

- **Security is paramount**: You need to keep private keys isolated from the main application logic, for example, in a hardware security module (HSM) or a secure enclave.
- **Interacting with external wallets**: Your application needs to request signatures from a user's wallet, such as a browser extension (e.g., Alby, Noster) or a mobile wallet.
- **Complex key management**: Your application uses a more complex key management architecture that doesn't involve direct access to raw private keys.

## Implementing the `NostrSigner` Interface

To create a custom signer, you need to create a class that implements the `NostrSigner` interface. This involves implementing two main methods: `getPublicKey()` and `signEvent()`, as well as an optional `nip44` object for encryption.

### Example: A NIP-07 Browser Signer (window.nostr)

A common use case for a custom signer is in a web application that needs to interact with a Nostr browser extension (like Alby, nos2x, or Blockcore) that exposes the `window.nostr` object according to [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md). This allows the application to request signatures and encryption from the user's wallet without ever handling private keys directly.

Here is how you could implement a `NostrSigner` that wraps the `window.nostr` object:

```typescript
import { NostrSigner } from "@ctxvm/sdk/core";
import { UnsignedEvent, NostrEvent } from "nostr-tools";

// Define the NIP-07 window.nostr interface for type-safety
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: UnsignedEvent): Promise<NostrEvent>;
      nip44?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}

class Nip07Signer implements NostrSigner {
  constructor() {
    if (!window.nostr) {
      throw new Error("NIP-07 compatible browser extension not found.");
    }
  }

  async getPublicKey(): Promise<string> {
    if (!window.nostr) throw new Error("window.nostr not found.");
    return await window.nostr.getPublicKey();
  }

  async signEvent(event: UnsignedEvent): Promise<NostrEvent> {
    if (!window.nostr) throw new Error("window.nostr not found.");
    return await window.nostr.signEvent(event);
  }

  nip44 = {
    encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
      if (!window.nostr?.nip44) {
        throw new Error("The extension does not support NIP-44 encryption.");
      }
      return await window.nostr.nip44.encrypt(pubkey, plaintext);
    },

    decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
      if (!window.nostr?.nip44) {
        throw new Error("The extension does not support NIP-44 decryption.");
      }
      return await window.nostr.nip44.decrypt(pubkey, ciphertext);
    },
  };
}
```

### Implementing `nip44` for Decryption

When using a NIP-07 signer, the `nip44` implementation is straightforward, as you can see in the example above. You simply delegate the calls to the `window.nostr.nip44` object.

It's important to include checks to ensure that the user's browser extension supports `nip44`, as it is an optional part of the NIP-07 specification. If the extension does not support it, you should throw an error to prevent unexpected behavior.

## Using Your Custom Signer

Once your custom signer class is created, you can instantiate it and pass it to any component that requires a `NostrSigner`, such as the `NostrClientTransport` or `NostrServerTransport`. The rest of the SDK will use your custom implementation seamlessly.

## Next Steps

With the `Signer` component covered, let's move on to the **[Relay](/contextvm-docs/relay/simple-relay-pool)** component, which handles the connection and management of Nostr relays.
