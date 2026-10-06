---
title: Run a Lightning-Paid ContextVM Tool
description: Configure a one-sat ContextVM tool, pay its BOLT11 invoice over NWC, and verify that execution begins only after settlement.
---

# Run a Lightning-paid ContextVM tool

This quickstart runs a server and client in one Bun process. The server requests one sat before it calls the `add` tool. The client approves the request and pays the BOLT11 invoice through Nostr Wallet Connect (NWC).

## Prerequisites and tested versions

This guide targets:

- Bun 1.3.14
- `@contextvm/sdk` 0.14.3
- `@contextvm/mcp-sdk` 1.30.0
- `nostr-tools` 2.25.2
- `zod` 4.5.4
- one NWC connection with `make_invoice` and `lookup_invoice` permissions for the server wallet
- a separate funded NWC connection with `pay_invoice` permission for the client wallet

Use wallets and NWC budgets intended for development. NWC connection strings authorize wallet actions and must remain secret.

## Create the project

```bash
mkdir contextvm-paid-tool
cd contextvm-paid-tool
bun init -y
bun add @contextvm/sdk@0.14.3 @contextvm/mcp-sdk@1.30.0 \
  nostr-tools@2.25.2 zod@4.5.4
```

Generate two Nostr private keys:

```bash
bun -e "import { generateSecretKey } from 'nostr-tools/pure'; import { bytesToHex } from 'nostr-tools/utils'; console.log(bytesToHex(generateSecretKey())); console.log(bytesToHex(generateSecretKey()));"
```

Create `.env` with the generated keys and the two NWC connection strings:

```dotenv
SERVER_PRIVATE_KEY=<first-64-character-hex-key>
CLIENT_PRIVATE_KEY=<second-64-character-hex-key>
NWC_SERVER_CONNECTION=nostr+walletconnect://...
NWC_CLIENT_CONNECTION=nostr+walletconnect://...
```

Do not commit `.env`.

## Add the paid server and client

Create `paid-demo.ts`:

```ts
import { Client } from "@contextvm/mcp-sdk/client";
import { McpServer } from "@contextvm/mcp-sdk/server/mcp";
import {
  ApplesauceRelayPool,
  LnBolt11NwcPaymentHandler,
  LnBolt11NwcPaymentProcessor,
  NostrClientTransport,
  NostrServerTransport,
  PrivateKeySigner,
  withClientPayments,
  withServerPayments,
} from "@contextvm/sdk";
import { z } from "zod";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const relayUrl = "wss://relay.contextvm.org";
const serverSigner = new PrivateKeySigner(requireEnv("SERVER_PRIVATE_KEY"));
const clientSigner = new PrivateKeySigner(requireEnv("CLIENT_PRIVATE_KEY"));
const serverPublicKey = await serverSigner.getPublicKey();

const mcpServer = new McpServer({
  name: "paid-add-server",
  version: "1.0.0",
});

mcpServer.registerTool(
  "add",
  {
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => {
    console.log("Paid tool executed");
    return { content: [{ type: "text", text: String(a + b) }] };
  },
);

const serverTransport = withServerPayments(
  new NostrServerTransport({
    signer: serverSigner,
    relayHandler: new ApplesauceRelayPool([relayUrl]),
  }),
  {
    processors: [
      new LnBolt11NwcPaymentProcessor({
        nwcConnectionString: requireEnv("NWC_SERVER_CONNECTION"),
      }),
    ],
    pricedCapabilities: [
      {
        method: "tools/call",
        name: "add",
        amount: 1,
        currencyUnit: "sats",
        description: "One paid addition",
      },
    ],
    paymentInteraction: "transparent",
  },
);

await mcpServer.connect(serverTransport);

const clientTransport = withClientPayments(
  new NostrClientTransport({
    signer: clientSigner,
    relayHandler: new ApplesauceRelayPool([relayUrl]),
    serverPubkey: serverPublicKey,
  }),
  {
    handlers: [
      new LnBolt11NwcPaymentHandler({
        nwcConnectionString: requireEnv("NWC_CLIENT_CONNECTION"),
      }),
    ],
    paymentPolicy: ({ amount, pmi }) => {
      console.log(`Payment required: ${amount} sat via ${pmi}`);
      return amount <= 1;
    },
  },
);

const client = new Client({ name: "paid-add-client", version: "1.0.0" });

try {
  await client.connect(clientTransport);
  const result = await client.callTool({
    name: "add",
    arguments: { a: 1, b: 2 },
  });
  const typedResult = result as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = typedResult.content.find((item) => item.type === "text");
  console.log(`Result: ${text?.text}`);
} finally {
  await client.close();
  await mcpServer.close();
}
```

## Run and verify the flow

```bash
LOG_LEVEL=info bun run paid-demo.ts
```

Alongside SDK logs, look for these application lines in this order:

```text
Payment required: 1 sat via bitcoin-lightning-bolt11
Paid tool executed
Result: 3
```

Those lines establish three separate outcomes:

1. The client received a correlated `notifications/payment_required` request for one sat.
2. The server verified settlement before it invoked the tool handler.
3. The original MCP call completed with the tool result.

The server also sends `notifications/payment_accepted` after verification. Delivery of that notification is best effort; the completed tool result is the final success signal.

## Failure signals

- **No payment-required line:** the request did not match `method: 'tools/call'` and `name: 'add'`, or the peers did not connect through the same relay.
- **`NWC pay_invoice failed`:** the client NWC connection lacks permission, balance, or a usable wallet response.
- **The invoice is paid but `Paid tool executed` never appears:** inspect the server wallet's `lookup_invoice` support. If its info event advertises `payment_received` but notifications are unreliable, set `enableNotificationVerification: false` on `LnBolt11NwcPaymentProcessor` to force settlement polling.
- **`Payment declined by client policy`:** `paymentPolicy` returned `false`; no wallet payment was attempted.
- **`notifications/payment_rejected`:** server pricing or authorization rejected the call before creating an invoice; the tool was not invoked.

Do not retry a paid call blindly after an uncertain timeout. Check the wallet and server logs first so a new request does not create another invoice.

## What to read next

- [Configure server payment policy](/how-to/payments/server)
- [Control client payment behavior](/how-to/payments/client)
- [Configure Lightning over NWC](/how-to/payments/rails/lightning-nwc)
- [Handle payments with explicit gating](/how-to/payments/explicit-gating)
