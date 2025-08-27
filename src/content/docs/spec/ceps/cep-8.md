---
title: CEP-8 Capability Pricing and Payment Flow
description: Pricing mechanism and payment processing for ContextVM capabilities
---

# Capability Pricing and Payment Flow

**Status:** Draft
**Author:** @Gzuuus
**Type:** Standards Track

## Abstract

This CEP proposes a standardized pricing mechanism and payment flow for MCP capabilities over ContextVM. The mechanism allows servers to advertise pricing for their capabilities, enables clients to discover and pay for these capabilities through various payment methods, and defines a notification system for payment requests. This creates a sustainable ecosystem for capability servers while maintaining the decentralized nature of the protocol.

## Specification

### Overview

ContextVM pricing for capabilities is implemented through a standardized mechanism with three main components:

1. **Pricing Tags**: Servers advertise pricing information using the `cap` tag
2. **Payment Method Identifiers (PMI)**: Both parties advertise supported payment methods using the `pmi` tag
3. **Payment Notifications**: Servers notify clients of payment requirements through the `notifications/payment_required` notification

When a capability requires payment, the server acts as the payment processor (generating and validating payment requests) while the client acts as the payment handler (executing payments for supported payment methods). Clients can discover supported payment methods beforehand through PMI discovery, enabling informed decisions before initiating requests.

### New Tags Introduced

This CEP introduces two new tags to the ContextVM protocol:

#### `cap` Tag

The `cap` tag is used to convey pricing information for capabilities. It follows this format:

```json
["cap", "<capability-identifier>", "<price>", "<currency-unit>"]
```

Where:

- `<capability-identifier>` is the name of the tool, prompt, or resource URI
- `<price>` is a string representing the numerical amount. For fixed prices, this is an integer (e.g., "100"). For variable prices, this can be a range (e.g., "100-1000") to indicate a variable pricing model.
- `<currency-unit>` is the currency symbol (e.g., "sats", "usd")

#### `pmi` Tag

The `pmi` tag is used to advertise supported Payment Method Identifiers. It follows this format:

```json
["pmi", "<payment-method-identifier>"]
```

Where `<payment-method-identifier>` is a standardized PMI string following the W3C Payment Method Identifiers specification (e.g., "bitcoin-lightning-bolt11", "bitcoin-cashu").

### Pricing Mechanism

Pricing information is advertised using the `cap` tag in server announcements and capability list responses:

#### Server Announcements

```json
{
  "kind": 11317,
  "content": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather information"
        // ... other tool properties
      }
    ]
  },
  "tags": [["cap", "get_weather", "100", "sats"]]
}
```

#### Capability List Responses

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "result": {
      "tools": [
        {
          "name": "get_weather",
          "description": "Get current weather information"
          // ... other tool properties
        }
      ],
      "nextCursor": "next-page-cursor"
    }
  },
  "tags": [
    ["e", "<request-event-id>"],
    ["cap", "get_weather", "100", "sats"]
  ]
}
```

The `cap` tag indicates that using the `get_weather` tool costs 100 satoshis, allowing clients to display pricing to users.

### Payment Method Identifiers (PMI)

The protocol supports multiple payment methods through Payment Method Identifiers (PMI) that follow the W3C Payment Method Identifiers specification.

#### PMI Format and Registry

PMIs MUST follow the format defined by the [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/) specification, matching the pattern: `[a-z0-9-]+` (e.g., `bitcoin-onchain`, `bitcoin-lightning-bolt11`, `bitcoin-cashu`, `basic-card`, etc).

**ContextVM PMI References:**

- `"bitcoin-onchain"` - Bitcoin on-chain transactions
- `"bitcoin-lightning-bolt11"` - Lightning Network with BOLT11 invoice format
- `"bitcoin-cashu"` - Bitcoin via Cashu ecash tokens

**Note:** The listed PMIs are reference recommendations for the ContextVM ecosystem. Users can use any PMI that follows the W3C format, propose new PMIs for inclusion, or extend the reference list over time.

#### PMI Benefits and Roles

Using standardized PMIs provides:

1. **Interoperability**: Clear communication about supported payment methods
2. **Extensibility**: Easy addition of new payment methods
3. **Multi-currency support**: Different PMIs handle different currencies and networks
4. **Clear separation of concerns**: Servers focus on payment processing, clients on payment handling

### PMI Discovery

PMI discovery allows clients and servers to determine compatibility with payment methods, similar to encryption support discovery in [CEP-4](/spec/ceps/cep-4).

#### PMI Advertisement

Servers advertise supported PMIs using the `pmi` tag in initialization responses or public announcements:

```json
{
  "pubkey": "<server-pubkey>",
  "content": {
    /* server details */
  },
  "tags": [
    ["pmi", "bitcoin-lightning-bolt11"],
    ["pmi", "bitcoin-cashu"],
    ["pmi", "bitcoin-onchain"]
  ]
}
```

Clients advertise their supported PMIs in initialization requests:

```json
{
  "kind": 25910,
  "content": {
    "jsonrpc": "2.0",
    "id": 0,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-07-02"
      // Other initialization parameters
    }
  },
  "tags": [
    ["p", "<server-pubkey>"],
    ["pmi", "bitcoin-lightning-bolt11"],
    ["pmi", "bitcoin-cashu"]
  ]
}
```

#### Discovery Methods

Clients can discover PMI support through:

1. **Public Announcements**: Check `pmi` tags in server announcements
2. **Initialization Responses**: Check `pmi` tags in server initialization responses
3. **Stateless Operations**: Handle compatibility at request time when no prior discovery is possible

Servers can discover PMI support through:

1. **Client Initialization Request**: Check `pmi` tags in client initialization request

### Payment Flow

The complete payment flow for a capability with pricing information follows these steps:

#### 1. Capability Request

The client sends a capability request to the server:

```json
{
  "kind": 25910,
  "id": "<request-event-id>",
  "pubkey": "<client-pubkey>",
  "content": {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_weather",
      "arguments": {
        "location": "New York"
      }
    }
  },
  "tags": [["p", "<provider-pubkey>"]]
}
```

#### 2. Payment Required Notification

If the capability requires payment, the server responds with a `notifications/payment_required` notification containing payment details:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_required",
    "params": {
      "amount": 1000,
      "pay_req": "lnbc...",
      "description": "Payment for tool execution",
      "pmi": "bitcoin-lightning-bolt11"
    }
  },
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

#### 3. Payment Processing

The client processes the payment and the server verifies it. When the client receives a payment request notification, it matches the PMI to determine if it supports the specified payment method. If compatible, the client processes the payment using the appropriate method for that PMI. The server verifies the payment according to the PMI implementation.

#### 4. Capability Access

Once payment is verified, the server processes the capability request and responds with the result:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
      "content": [
        {
          "type": "text",
          "text": "Current weather in New York:\nTemperature: 72°F\nConditions: Partly cloudy"
        }
      ],
      "isError": false
    }
  },
  "tags": [["e", "<request-event-id>"]]
}
```

### Payment Request Notification Fields

The `notifications/payment_required` notification `params` object contains:

- `amount` (required): Numeric payment amount
- `pay_req` (required): Payment request data string
- `description` (optional): Human-readable payment description
- `pmi` (required): Payment Method Identifier string

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol:

- **Existing servers** can continue to operate without pricing
- **Existing clients** continue to work with existing servers
- **New pricing** is additive - capabilities can be free or paid
- **Optional participation**: Both providers and clients can choose to participate in pricing

## Reference Implementation

// TODO

## Dependencies

- [CEP-4: Encryption Support](/spec/ceps/cep-4)
- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/)
