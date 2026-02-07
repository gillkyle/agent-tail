# agent-tail

Pipe browser console logs to files on disk during development. Tail them in your terminal alongside your backend server and worker logs.

## Packages

| Package | Description |
|---------|-------------|
| [`vite-plugin-agent-tail`](./packages/vite-plugin) | Vite plugin |
| [`next-plugin-agent-tail`](./packages/next-plugin) | Next.js plugin |
| [`agent-tail-core`](./packages/core) | Shared core (types, formatting, log management) |

## Quick Start (Vite)

```bash
npm install -D vite-plugin-agent-tail
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { browser_logs } from "vite-plugin-agent-tail"

export default defineConfig({
    plugins: [browser_logs()],
})
```

Then in another terminal:

```bash
tail -f tmp/logs/latest/browser.log
```

## Quick Start (Next.js)

```bash
npm install -D next-plugin-agent-tail
```

```ts
// next.config.ts
import { with_browser_logs } from "next-plugin-agent-tail"

export default with_browser_logs({
    // your Next.js config
})
```

```tsx
// app/layout.tsx
import { BrowserLogsScript } from "next-plugin-agent-tail/script"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                {process.env.NODE_ENV === "development" && <BrowserLogsScript />}
            </head>
            <body>{children}</body>
        </html>
    )
}
```

```ts
// app/api/__browser-logs/route.ts
export { POST } from "next-plugin-agent-tail/handler"
```

## How It Works

1. On dev server start, a timestamped session directory is created (e.g. `tmp/logs/2024-01-15T10-30-00-123Z/`)
2. A `latest` symlink points to the newest session
3. A small script is injected into your HTML that intercepts console methods
4. Captured logs are batched and sent to the dev server via `sendBeacon`
5. The server writes formatted log lines to `browser.log` in the session directory
6. Old sessions beyond the limit are automatically pruned (default: keep 10)

## Configuration

All options are optional with sensible defaults:

```ts
browser_logs({
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
})
```

## Log Format

```
[HH:MM:SS.mmm] [LEVEL  ] message (url)
    stack trace line 1
    stack trace line 2
```

Example:

```
[10:30:00.123] [LOG    ] User clicked button
[10:30:00.456] [WARN   ] Deprecated API call
[10:30:01.789] [ERROR  ] Failed to fetch data (http://localhost:5173/src/api.ts:42:10)
    Error: Network error
        at fetchData (http://localhost:5173/src/api.ts:42:10)
        at handleClick (http://localhost:5173/src/app.ts:15:5)
```

## Directory Structure

```
your-project/
├── tmp/
│   └── logs/
│       ├── 2024-01-15T10-30-00-123Z/
│       │   └── browser.log
│       ├── 2024-01-15T11-45-00-456Z/
│       │   └── browser.log
│       └── latest -> 2024-01-15T11-45-00-456Z/
└── vite.config.ts
```

## .gitignore Setup

The plugin warns if your log directory isn't covered by `.gitignore`. Add:

```gitignore
tmp/
```

## Multi-Server Log Aggregation

The `latest` symlink makes it easy to pipe logs from multiple servers into one place. Start your Vite/Next dev server first (it creates the session directory), then point other servers at the same location.

### Python Backend

```python
import os
import logging

log_dir = os.path.join(os.getcwd(), "tmp", "logs", "latest")
os.makedirs(log_dir, exist_ok=True)

handler = logging.FileHandler(os.path.join(log_dir, "backend.log"))
handler.setFormatter(logging.Formatter(
    "[%(asctime)s] [%(levelname)-7s] %(message)s",
    datefmt="%H:%M:%S"
))

logger = logging.getLogger("backend")
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
```

### Job Queue (RQ, Celery, etc.)

```python
import os
import logging

log_dir = os.path.join(os.getcwd(), "tmp", "logs", "latest")
os.makedirs(log_dir, exist_ok=True)

handler = logging.FileHandler(os.path.join(log_dir, "worker.log"))
handler.setFormatter(logging.Formatter(
    "[%(asctime)s] [%(levelname)-7s] %(message)s",
    datefmt="%H:%M:%S"
))

logger = logging.getLogger("worker")
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
```

### Node.js Backend

```ts
import fs from "node:fs"
import path from "node:path"

const log_dir = path.resolve("tmp/logs/latest")
fs.mkdirSync(log_dir, { recursive: true })

const log_stream = fs.createWriteStream(
    path.join(log_dir, "server.log"),
    { flags: "a" }
)

function log(level: string, ...args: unknown[]) {
    const time = new Date().toTimeString().slice(0, 12)
    const msg = args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ")
    log_stream.write(`[${time}] [${level.toUpperCase().padEnd(7)}] ${msg}\n`)
}
```

### Tailing All Logs

```bash
tail -f tmp/logs/latest/*.log
```

## Captured Events

Beyond console methods, the plugin captures:

- **Unhandled errors** (`window.onerror`) — logged as `UNCAUGHT_ERROR`
- **Unhandled promise rejections** — logged as `UNHANDLED_REJECTION`

Disable with `captureErrors: false` and `captureRejections: false`.

## License

MIT
