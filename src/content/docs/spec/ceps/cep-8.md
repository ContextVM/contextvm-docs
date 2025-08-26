---
title: CEP-8 Capability Pricing and Payment Flow
description: Pricing mechanism and payment processing for ContextVM capabilities
---

# Capability Pricing and Payment Flow

**Status:** Draft  
**Author:** @Gzuuus
**Type:** Standards Track

## Abstract

This CEP proposes a standardized pricing mechanism and payment flow for ContextVM capabilities. The mechanism allows providers to advertise pricing for their capabilities, and enables clients to discover and pay for these capabilities through various payment methods. This creates a sustainable ecosystem for capability providers while maintaining the decentralized nature of the protocol.

## Specification

### Overview

ContextVM pricing for capabilities is defined through the use of `cap` tags in capability announcement or list capabilities responses. This allows providers to advertise their pricing and enables clients to discover and pay for capabilities. When a capability requires payment, the server acts as the payment processor (generating and validating payment requests) while the client acts as the payment handler (executing payments for supported payment methods).

### Pricing Mechanism

#### Pricing Tag Format

Pricing information is conveyed using the `cap` tag with the following format:

```json
["cap", "<capability-identifier>", "<price>", "<currency-unit>"]
```

Where:

- `<capability-identifier>` is the name of the tool, prompt, or resource URI
- `<price>` is a string representing the numerical amount (e.g., "100")
- `<currency-unit>` is the currency symbol (e.g., "sats", "usd")

#### Pricing in Server Announcements

Pricing can be advertised in server announcement events.

##### Example: Tools List Event with Pricing

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

#### Pricing in Capability List Responses

Pricing can also be included in capability list responses.

##### Example: Tools List Response with Pricing

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
    ["e", "<request-event-id>"], // Required: Reference to the request event
    ["cap", "get_weather", "100", "sats"] // Optional: Pricing metadata
  ]
}
```

This indicates that using the `get_weather` tool costs 100 satoshis. Clients can use this information to display pricing to users.

### Payment Flow

When a capability has pricing information, clients and servers engage in a payment flow. The lifecycle of a request with payment follows these steps:

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

#### 2. Payment Request Notification

If the capability requires payment, the server responds with a `notifications/payment_required` notification containing payment details:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_required",
    "params": {
      "amount": 1000,
      "invoice": "lnbc...",
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

#### Payment Request Notification Fields

The `notifications/payment_required` notification contains the following fields in its `params` object:

- `amount` (required): A numeric value representing the payment amount
- `invoice` (required): A string containing the payment invoice or payment request data
- `description` (optional): A human-readable description of the payment purpose
- `pmi` (required): A Payment Method Identifier string specifying the payment method

The `pmi` field contains a Payment Method Identifier that specifies the payment method being used. This MUST be a standardized PMI string, following the format defined by the W3C Payment Method Identifiers specification, matching the pattern: `[a-z0-9-]+` (e.g., `bitcoin`, `bitcoin-lightning-bolt11`, `bitcoin-cashu`, `basic-card`, etc).

#### 3. Payment Processing

The client processes the payment and the server verifies it. When the client receives a payment request notification, it matches the PMI to determine if it supports the specified payment method. If compatible, the client processes the payment using the appropriate method for that PMI.

Payment verification can be implemented using various methods:

- **Lightning Network zaps**
- **Cashu PaymentRequests**
- **Payment gateway URLs**
- **Custom payment verification**

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

### Payment Method Identifiers (PMI)

The protocol supports multiple payment methods through Payment Method Identifiers (PMI) that follow the format defined by the W3C Payment Method Identifiers specification.

#### W3C Payment Method Identifiers Standard

Payment Method Identifiers are defined by the W3C in the [Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/) specification (W3C Recommendation 08 September 2022). This specification defines how payment method identifiers are validated, and, where applicable, minted and formally registered with the W3C. Other specifications (e.g., the Payment Request API) make use of these identifiers to facilitate monetary transactions on the web platform.

#### ContextVM PMI Registry

While ContextVM follows the W3C PMI format and validation rules, we maintain an unofficial registry of PMIs for use within the ContextVM ecosystem. These PMIs are not officially minted with the W3C but follow the same pattern and validation rules.

#### ContextVM PMI References:

- `"bitcoin"` - Bitcoin on-chain transactions
- `"bitcoin-lightning"` - Lightning Network payments
- `"bitcoin-lightning-bolt11"` - Lightning Network with BOLT11 invoice format
- `"bitcoin-cashu"` - Bitcoin via Cashu ecash tokens

#### PMI Standardization Benefits

Using standardized PMIs provides several benefits:

1. **Interoperability**: Clients and servers can clearly communicate about supported payment methods
2. **Extensibility**: New payment methods can be added by defining new PMIs
3. **Multi-currency support**: Different PMIs can handle different currencies and payment networks
4. **Clear separation of concerns**: Servers focus on payment processing (generating and validating payment requests), while clients focus on payment handling (executing payments for supported PMIs)

#### Roles in Payment Processing

The PMI system enables a clear separation of responsibilities:

- **Server (Payment Processor)**: Encapsulates all logic to produce payment requests for the payment methods it supports and validates payments after they are made.
- **Client (Payment Handler)**: Handles the logic to pay for supported PMIs, determining compatibility with the server's requested payment method and executing the payment.

When servers send payment request notifications, clients can match the PMI and assert they are compatible with such PMI. This enables a robust multi-currency and multi-payment-method ecosystem while maintaining clear boundaries of responsibility.

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol:

- **Existing servers** can continue to operate without pricing
- **Existing clients** continue to work with existing servers
- **New pricing** is additive - capabilities can be free or paid
- **Optional participation**: Both providers and clients can choose to participate in pricing

The only requirement is that new pricing information follows the specified format, which doesn't affect existing functionality.

## Reference Implementation

// TODO

## Dependencies

- [CEP-6: Public Server Announcements](/spec/ceps/cep-6)
- [W3C Payment Method Identifiers](https://www.w3.org/TR/payment-method-id/)
