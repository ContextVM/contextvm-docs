---
title: Deployment
description: Deploy ContextVM servers and clients in production environments with Docker, environment variables, and monitoring.
---

# Deployment

Deploy ContextVM servers and clients in production environments.

## Environment Variables

### Required

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `SERVER_PRIVATE_KEY` | Server's Nostr private key (hex) | `32-byte-hex-string` |
| `CLIENT_PRIVATE_KEY` | Client's Nostr private key (hex) | `32-byte-hex-string` |

### Optional

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `RELAYS` | Comma-separated relay URLs | `wss://relay.contextvm.org` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `LOG_DESTINATION` | Where to write logs | `stderr` |
| `LOG_FILE` | Log file path (if destination=file) | - |
| `ENCRYPTION_MODE` | `optional`, `required`, `disabled` | `optional` |

## Docker Deployment

### Basic Server Container

```dockerfile
FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV SERVER_PRIVATE_KEY=""
ENV RELAYS="wss://relay.contextvm.org,wss://cvm.otherstuff.ai"
ENV LOG_LEVEL="info"

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
```

Build and run:

```bash
docker build -t my-cvm-server .
docker run -e SERVER_PRIVATE_KEY=$SERVER_PRIVATE_KEY my-cvm-server
```

### Docker Compose

```yaml
version: "3.8"
services:
  cvm-server:
    build: .
    environment:
      - SERVER_PRIVATE_KEY=${SERVER_PRIVATE_KEY}
      - RELAYS=wss://relay.contextvm.org,wss://cvm.otherstuff.ai
      - LOG_LEVEL=info
      - ENCRYPTION_MODE=optional
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Run with:

```bash
docker-compose up -d
```

## Relay Configuration

### Recommended Public Relays

```
wss://relay.contextvm.org
wss://cvm.otherstuff.ai
wss://nos.lol
```

### Production Considerations

- Use 3-5 relays for redundancy
- Include at least 2 geographically distributed
- Monitor relay uptime
- Have backup relay list ready

### Private Relay Setup

For sensitive deployments:

```typescript
const relayPool = new ApplesauceRelayPool([
  "wss://private-relay.your-domain.com",
]);
```

## Security Best Practices

### Key Management

✓ **DO**:

- Store keys in environment variables
- Use secret management if the security of the server requires it (AWS Secrets Manager, HashiCorp Vault)
- Rotate keys periodically
- Use different keys for different environments

✗ **DON'T**:

- Hardcode keys in source
- Commit keys to version control
- Log private keys
- Share keys between services

### Access Control

```typescript
// Whitelist specific clients
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  allowedPublicKeys: [
    process.env.CLIENT_1_PUBKEY!,
    process.env.CLIENT_2_PUBKEY!,
  ],
});
```

### Encryption

Enable encryption in production:

```typescript
const transport = new NostrServerTransport({
  signer,
  relayHandler: relayPool,
  encryptionMode: EncryptionMode.REQUIRED,
});
```

## Health Checks

### Server Health Check

```typescript
async function healthCheck(server: McpServer): Promise<boolean> {
  try {
    // Check if server responds to ping
    await server.ping();
    return true;
  } catch {
    return false;
  }
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run healthcheck.ts || exit 1
```

## Monitoring

### Structured Logging

```typescript
import { createLogger } from "@contextvm/sdk/core";

const logger = createLogger("server");

// Production log format
logger.info("request.completed", {
  module: "server",
  method: "tools/call",
  tool: "echo",
  clientPubkey: pubkey.slice(0, 8) + "...",
  durationMs: 45,
});
```

### Metrics to Track

- Request rate and latency
- Error rate by type
- Active connections
- Relay connection status
- Event publish/subscribe rates

### Example Monitoring Setup

```typescript
import { createLogger } from "@contextvm/sdk/core";

const metrics = {
  requests: 0,
  errors: 0,
  latencySum: 0,
};

// Middleware to track metrics
async function trackMetrics(request: Request, next: () => Promise<Response>) {
  const start = Date.now();
  metrics.requests++;
  
  try {
    const response = await next();
    return response;
  } catch (error) {
    metrics.errors++;
    throw error;
  } finally {
    metrics.latencySum += Date.now() - start;
  }
}

// Expose metrics endpoint
setInterval(() => {
  const avgLatency = metrics.latencySum / metrics.requests;
  logger.info("metrics", {
    requests: metrics.requests,
    errors: metrics.errors,
    avgLatency,
  });
}, 60000);
```

## Graceful Shutdown

Handle shutdown signals properly:

```typescript
async function shutdown() {
  logger.info("shutting down");
  
  // Stop accepting new connections
  await server.disconnect();
  
  // Close relay connections
  await relayPool.disconnect();
  
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Production Checklist

- [ ] Keys in environment/secrets manager
- [ ] Logging configured appropriately
- [ ] Health checks implemented
- [ ] Error handling in place
- [ ] Graceful shutdown handling
- [ ] Resource limits set (Docker)
- [ ] Monitoring/alerting configured
- [ ] Encryption enabled
- [ ] Access control configured
- [ ] Backup relay list ready

## Related Resources

- [Server Development](/cvmi/skills/server-dev) — Building servers
- [Client Development](/cvmi/skills/client-dev) — Building clients
- [Troubleshooting](/cvmi/skills/troubleshooting) — Debugging issues
