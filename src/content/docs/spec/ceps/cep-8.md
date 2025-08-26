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

ContextVM pricing for capabilities is defined through the use of `cap` tags in capability announcement or list capabilities responses. This allows providers to advertise their pricing and enables clients to discover and pay for capabilities.

### Pricing Tag Format

Pricing information is conveyed using the `cap` tag with the following format:

```json
["cap", "<capability-identifier>", "<price>", "<currency-unit>"]
```

Where:

- `<capability-identifier>` is the name of the tool, prompt, or resource URI
- `<price>` is a string representing the numerical amount (e.g., "100")
- `<currency-unit>` is the currency symbol (e.g., "sats", "usd")

### Pricing in Server Announcements

Pricing can be advertised in server announcement events.

#### Example: Tools List Event with Pricing

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

### Pricing in Capability List Responses

Pricing can also be included in capability list responses.

#### Example: Tools List Response with Pricing

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

When a capability has pricing information, clients and servers should handle payments. In this flow the server have the role of payment processor; sending the payment request, and validating it after the payment, and the client have the role of payment handler; paying the payment request from the server. The lifecycle of request with payment follows these steps:

#### 1. Request

Client sends a capability request to the server:

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

#### 2. Invoice Generation

If the capability requires payment, the server responds with a `notifications/payment_required` notification containing payment details:

```json
{
  "kind": 25910,
  "pubkey": "<provider-pubkey>",
  "content": {
    "method": "notifications/payment_required",
    "params": {
      "amount": 1000,
      "currency": "sats",
      "invoice": "lnbc...",
      "description": "Payment for tool execution"
    }
  },
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

#### 3. Payment Verification

Client processes the payment and the server verifies it. Payment verification can be implemented using various methods:

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

### Payment Methods

The protocol supports multiple payment methods through standardized notification formats:

## Backward Compatibility

This CEP introduces no breaking changes to the existing protocol:

- **Existing servers** can continue to operate without pricing
- **Existing clients** continue to work with existing servers
- **New pricing** is additive - capabilities can be free or paid
- **Optional participation**: Both providers and clients can choose to participate in pricing

The only requirement is that new pricing information follows the specified format, which doesn't affect existing functionality.

## Reference Implementation

// TODO
