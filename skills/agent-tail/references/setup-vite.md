# Vite Setup

## Install

```bash
npm install -D agent-tail
```

## Plugin setup

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [agentTail()],
})
```

Then tail logs from another terminal:

```bash
tail -f tmp/logs/latest/browser.log
```

## Configuration

All options are optional with sensible defaults:

```ts
agentTail({
    logDir: "tmp/logs",             // Directory for log storage (relative to project root)
    logFileName: "browser.log",     // Log file name within each session
    maxLogSessions: 10,             // Max session directories to keep
    endpoint: "/__browser-logs",    // Server endpoint for log ingestion
    flushInterval: 500,             // Client-side flush interval (ms)
    maxBatchSize: 50,               // Max batch size before immediate flush
    maxSerializeLength: 2000,       // Max serialized object length
    warnOnMissingGitignore: true,   // Warn if logDir isn't gitignored
    levels: ["log", "warn", "error", "info", "debug"],
    captureErrors: true,            // Capture unhandled window errors
    captureRejections: true,        // Capture unhandled promise rejections
    excludes: [],                   // Patterns to exclude (substring or /regex/)
})
```

## Filtering noisy logs

Use `excludes` to drop lines before they hit disk:

```ts
agentTail({
    excludes: [
        "[HMR]",                    // substring match
        "Download the React DevTools",
        "/^\\[vite\\]/",            // regex match (leading /)
    ],
})
```

Plain strings are substring matches. Patterns starting with `/` are parsed as regex (e.g. `/^HMR/i`).
