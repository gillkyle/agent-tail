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

## .gitignore Setup

Add your log directory to `.gitignore` to keep logs out of version control:

```
# .gitignore
tmp/
```

The plugin warns on startup if the log directory isn't gitignored. Disable with `warnOnMissingGitignore: false`.

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

## CLI: `agent-tail`

The `agent-tail` CLI wraps any dev server command and pipes its output into the unified log session. Install it from the core package:

```bash
npm install -D agent-tail-core
```

### `agent-tail run`

The easiest way to use agent-tail is to add a script to your `package.json`:

```json
{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'"
    }
}
```

Then `npm run dev` starts everything with unified logging. Each service argument is `"name: command"`.

This:
- Creates a new session directory
- Spawns all services concurrently
- Prefixes each line with `[name]` in the terminal (color-coded)
- Writes individual log files (`fe.log`, `api.log`, `worker.log`)
- Writes a `combined.log` with all output interleaved

If you prefer a shell script, you can also use multi-line syntax:

```bash
#!/bin/bash
npx agent-tail run \
  "fe: npm run dev:frontend" \
  "api: uv run fastapi-server" \
  "worker: uv run celery-worker"
```

### `agent-tail wrap`

Wraps a single command, piping its stdout/stderr to a named log file in the current session:

```bash
npx agent-tail wrap api -- uv run fastapi-server
npx agent-tail wrap worker -- python -m celery worker -A myapp
```

This creates `api.log` and `worker.log` in the latest session directory. Output still appears in your terminal. A `combined.log` is also written with `[name]` prefixes.

If no session exists yet, `wrap` creates one automatically. If a session already exists (e.g. started by the Vite plugin), it reuses it.

### `agent-tail init`

Creates a new log session directory and prints the path:

```bash
npx agent-tail init
# Output: /path/to/your-project/tmp/logs/2024-01-15T10-30-00-123Z
```

### CLI Options

```
--log-dir <dir>       Log directory relative to cwd (default: tmp/logs)
--max-sessions <n>    Max sessions to keep (default: 10)
--no-combined         Don't write to combined.log
```

## Multi-Server Log Aggregation

There are three ways to unify logs from multiple servers:

### Use `agent-tail run` (recommended)

Run everything from one command. Add it to `package.json` and forget about it:

```json
{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: python -m celery worker'"
    }
}
```

All output goes to the same session automatically. The Vite plugin still captures browser console logs via its injected script.

### Wrap services independently

If you prefer running each service in its own terminal:

```bash
# Terminal 1: Start the frontend (creates the session)
npm run dev

# Terminal 2: Wrap the API server (reuses the session)
npx agent-tail wrap api -- uv run fastapi-server

# Terminal 3: Wrap the worker (reuses the session)
npx agent-tail wrap worker -- python -m celery worker

# Terminal 4: Tail everything
tail -f tmp/logs/latest/*.log
```

The `wrap` command detects the existing session created by the Vite/Next plugin and writes to the same directory.

### Direct file writes (no CLI needed)

If your server has its own logging configuration, point it at the `latest` symlink:

#### Python (FastAPI, Django, Flask)

```python
import os
import logging

log_dir = os.path.join(os.getcwd(), "tmp", "logs", "latest")
os.makedirs(log_dir, exist_ok=True)

handler = logging.FileHandler(os.path.join(log_dir, "api.log"))
handler.setFormatter(logging.Formatter(
    "[%(asctime)s] [%(levelname)-7s] %(message)s",
    datefmt="%H:%M:%S"
))

logger = logging.getLogger("api")
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
```

#### Node.js (Express, Fastify, etc.)

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

#### Ruby (Rails, Sinatra)

```ruby
log_dir = File.join(Dir.pwd, "tmp", "logs", "latest")
FileUtils.mkdir_p(log_dir)

logger = Logger.new(File.join(log_dir, "rails.log"))
logger.formatter = proc { |severity, time, _, msg|
    "[#{time.strftime('%H:%M:%S.%L')}] [#{severity.ljust(7)}] #{msg}\n"
}
```

#### Go

```go
logDir := filepath.Join(".", "tmp", "logs", "latest")
os.MkdirAll(logDir, 0755)

f, _ := os.OpenFile(filepath.Join(logDir, "server.log"),
    os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
log.SetOutput(f)
```

## Searching and Tailing Logs

All commands below should be run from your **project root** (where `tmp/logs/` lives).

```bash
# Follow all logs in real time
tail -f tmp/logs/latest/*.log

# Follow a specific service
tail -f tmp/logs/latest/browser.log

# Colored split view (install: brew install multitail)
multitail tmp/logs/latest/browser.log tmp/logs/latest/api.log
```

Search across all logs in the current session:

```bash
# Find all errors across every service
grep -r "ERROR" tmp/logs/latest/

# Case-insensitive search
grep -ri "failed\|timeout\|exception" tmp/logs/latest/

# Show 5 lines of context around each match
grep -r -C 5 "ERROR" tmp/logs/latest/

# Search a specific service
grep "TypeError" tmp/logs/latest/browser.log
```

Filter and extract with `awk`:

```bash
# Only ERROR and WARN lines from browser logs
awk '/\[ERROR|\[WARN/' tmp/logs/latest/browser.log

# Everything after a specific timestamp
awk '/\[10:30:00/,0' tmp/logs/latest/browser.log
```

Count and summarize:

```bash
# Count errors per service
grep -rc "ERROR" tmp/logs/latest/

# Most frequent error messages
grep "ERROR" tmp/logs/latest/browser.log | sort | uniq -c | sort -rn | head
```

Use `rg` (ripgrep) for faster searches in larger sessions:

```bash
rg "ERROR|WARN" tmp/logs/latest/
rg "fetch.*failed" tmp/logs/latest/browser.log -C 3
```

## Captured Events

Beyond console methods, the plugin captures:

- **Unhandled errors** (`window.onerror`) — logged as `UNCAUGHT_ERROR`
- **Unhandled promise rejections** — logged as `UNHANDLED_REJECTION`

Disable with `captureErrors: false` and `captureRejections: false`.

## Agent Setup

To get the most out of agent-tail, tell your AI agent where the logs are. Add a snippet like this to your project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `SKILLS.md`, or equivalent):

```markdown
## Dev Logs

All dev server output is piped to `tmp/logs/`. The latest session is
symlinked at `tmp/logs/latest/`. Browser console output (console.log,
console.warn, console.error, unhandled errors, unhandled promise rejections)
is automatically captured to `tmp/logs/latest/browser.log` via a Vite plugin
during development.

When debugging, always check recent logs before guessing:

    grep -ri "error\|warn" tmp/logs/latest/
    tail -50 tmp/logs/latest/browser.log
```

This gives the agent passive context about where runtime truth lives, so it reads logs instead of speculating.

## Why Files, Not MCP

A dumb local log drain beats a "smart" protocol for agent workflows. ([longer discussion](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/))

- **Universal** — works with any agent, any editor, `tail`, `grep`, `jq`. MCP only works with agents that support it.
- **No moving parts** — `appendFile()` vs. a server process + protocol + tool registration + connection lifecycle. Any of those can fail silently.
- **Zero connection state** — the file is a persistent timeline, not a live stream you can miss. No "was I connected when the error happened?"
- **Deterministic for agents** — "read the last 200 lines of `tmp/logs/latest/browser.log`" beats hoping the model calls a tool correctly.
- **Human + AI see the same bytes** — no reformatting, no schema negotiation. "Check line 428" just works.
- **History for free** — full session history on disk. MCP sessions disappear after a crash. Agents reason better with context they can scroll back through.
- **No permission friction** — reading a local file is passive context. MCP tools may need approval, rate limiting, or sandbox exceptions.
- **Works across every stack** — every language can append to a file. Not every stack has a clean MCP SDK.

## License

MIT
