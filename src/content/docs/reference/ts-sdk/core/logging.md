---
title: Logging
description: Logging in the @contextvm/sdk
---

### Logging

The SDK uses Pino for high-performance logging with structured JSON output. By default, logs are written to stderr to comply with the MCP protocol expectations.

#### Basic Usage

[`typescript`](src/content/docs/ts-sdk/core/logging.md:10)

```typescript
import { createLogger } from "@contextvm/sdk/core";

// Create a logger for your module
const logger = createLogger("my-module");

logger.info("Application started");
logger.error("An error occurred", { error: "details" });
```

#### Configuration Options

[`typescript`](src/content/docs/ts-sdk/core/logging.md:20)

```typescript
import { createLogger, LoggerConfig } from "@contextvm/sdk/core";

const config: LoggerConfig = {
  level: "debug", // Minimum log level (debug, info, warn, error)
  file: "app.log", // Optional: log to a file instead of stderr
};

const logger = createLogger("my-module", config);
```

**Note:** Pretty printing is automatically enabled when logs are written to stderr/stdout (not to a file) for better readability during development.

#### Configuring with Environment Variables

The logger can be configured using environment variables, which is useful for adjusting log output without changing the code.

- **`LOG_LEVEL`**: Sets the minimum log level.
  - **Values**: `debug`, `info`, `warn`, `error`.
  - **Default**: `info`.
- **`LOG_DESTINATION`**: Sets the log output destination.
  - **Values**: `stderr` (default), `stdout`, or `file`.
- **`LOG_FILE`**: Specifies the file path when `LOG_DESTINATION` is `file`.
- **`LOG_ENABLED`**: Enables or disables logging.
  - **Values**: `true` (default) or `false`.

##### Configuration in Node.js

[`bash`](src/content/docs/ts-sdk/core/logging.md:49)

```bash
# Set log level to debug
LOG_LEVEL=debug node app.js

# Log to a file instead of the console
LOG_DESTINATION=file LOG_FILE=./app.log node app.js

# Disable logging entirely
LOG_ENABLED=false node app.js
```

##### Configuration in Browsers

[`javascript`](src/content/docs/ts-sdk/core/logging.md:63)

```javascript
// Set this in a <script> tag in your HTML or at the top of your entry point
window.LOG_LEVEL = "debug";

// Now, when you import and use the SDK, it will use the 'debug' log level.
import { logger } from "@contextvm/sdk";
logger.debug("This is a debug message.");
```

#### Module-specific Loggers

[`typescript`](src/content/docs/ts-sdk/core/logging.md:75)

```typescript
const baseLogger = createLogger("my-app");
const authLogger = baseLogger.withModule("auth");
const dbLogger = baseLogger.withModule("database");

authLogger.info("User login attempt");
dbLogger.debug("Query executed", { query: "SELECT * FROM users" });
```

#### Conventions and Best Practices

- Log levels:
  - debug: detailed developer-oriented information (traces, SQL queries, internal state).
  - info: high-level lifecycle events and successful operations (startup, shutdown, user actions).
  - warn: unexpected situations that don't stop execution but may need attention.
  - error: failures that require investigation (exceptions, failed requests).
- Use structured fields to add context instead of human-parsed messages. Preferred field names:
  - `module`: module or component name (string).
  - `event`: short event name (string).
  - `txId` / `traceId`: request or trace identifier (string).
  - `userId`: authenticated user id when applicable (string).
  - `durationMs`: operation duration in milliseconds (number).
  - `error`: when logging errors, include an `error` object with `message` and `stack`.
- Avoid logging sensitive data (passwords, secrets, full tokens). Redact or hash when necessary.
- Keep log messages concise and use structured metadata for details.
- Prefer logger.method(message, meta) over string interpolation that embeds structured data into the message.

#### Examples (Best Practice)

[`typescript`](src/content/docs/ts-sdk/core/logging.md:105)

```typescript
logger.info("payment.processed", {
  module: "payments",
  txId: "abcd-1234",
  userId: "user-42",
  amount: 1999,
  currency: "EUR",
  durationMs: 245,
});

try {
  // do something that throws
} catch (err) {
  logger.error("payment.failed", {
    module: "payments",
    txId: "abcd-1234",
    error: { message: err.message, stack: err.stack },
  });
}
```

#### Performance and Safety

- The SDK logger is optimized for minimal allocations. Prefer structured objects over building large strings.
- When logging high-frequency events, consider using lower log levels (info -> debug) or sampling.
- Ensure log files are rotated and monitored if using file destinations.

---

See also: [`src/content/docs/ts-sdk/core/interfaces.md`](src/content/docs/ts-sdk/core/interfaces.md:1)
