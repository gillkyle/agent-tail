# &>> agent-tail

Pipe dev server and browser console logs to log files on your machine that AI coding agents like Claude Code, Amp, and Pi can read and grep.

[Documentation](https://agent-tail.vercel.app/)

![agent-tail demo](https://github.com/gillkyle/agent-tail/raw/refs/heads/main/assets/agent-tail-demo.gif)

**Try it!**

```bash
npx agent-tail-core run 'server: echo "Hello world!"' && cat tmp/logs/latest/server.log
```

That's the full cycle: run a command, output is captured to a log file, read the file.

## Two ways to use agent-tail

### 1. CLI — capture server output

`agent-tail run` wraps any command (or commands!) and pipes their stdout/stderr to log files. Works with any dev server, any language, zero config.

```bash
npx agent-tail-core run 'fe: npm run dev' 'api: uv run server'
```

Each service gets its own log file (`api.log`, `worker.log`) plus a `combined.log` with all output interleaved. See [CLI: `agent-tail`](#cli-agent-tail) for full usage.

### 2. Framework plugins — capture browser console output

The Vite and Next.js plugins inject a small script into your HTML that intercepts `console.log`, `console.warn`, `console.error`, unhandled errors, and unhandled promise rejections. Captured logs are sent to the dev server and written to `browser.log`.

See [Quick Start](#quick-start) below for setup.

### Then, use both together

The CLI and framework plugins write to the same session directory. Run your Vite dev server through `agent-tail run` and you get server output *and* browser console logs in one place:

```bash
agent-tail run 'fe: npm run dev' 'api: uv run server'
# tmp/logs/latest/fe.log        — Vite server output
# tmp/logs/latest/browser.log   — browser console (via plugin)
# tmp/logs/latest/api.log       — API server output
# tmp/logs/latest/combined.log  — everything interleaved
```

## Table of Contents

- [Two ways to use agent-tail](#two-ways-to-use-agent-tail) — [CLI](#cli--capture-server-output) | [Framework plugins](#framework-plugins--capture-browser-console-output)
- [Packages](#packages)
- [Quick Start](#quick-start) — [Vite](#vite) | [Next.js](#nextjs)
- [How It Works](#how-it-works)
- [Configuration](#configuration) — [.gitignore](#gitignore) | [Log Format](#log-format) | [Captured Events](#captured-events)
- [CLI: `agent-tail`](#cli-agent-tail) — [run](#agent-tail-run) | [init + wrap](#agent-tail-init--agent-tail-wrap)
- [Multi-Server Log Aggregation](#multi-server-log-aggregation)
- [Searching and Tailing Logs](#searching-and-tailing-logs)
- [Agent Setup](#agent-setup)
- [Why Files, Not MCP](#why-files-not-mcp)

## Packages

| Package | Description |
|---------|-------------|
| [`agent-tail-core`](./packages/core) | CLI and shared core (types, formatting, log management) |
| [`vite-plugin-agent-tail`](./packages/vite-plugin) | Vite plugin — browser console capture |
| [`next-plugin-agent-tail`](./packages/next-plugin) | Next.js plugin — browser console capture |

## Quick Start

### Vite

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

### Next.js

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

### CLI

1. `agent-tail run` spawns your services and creates a timestamped session directory (e.g. `tmp/logs/2024-01-15T10-30-00-123Z/`)
2. A `latest` symlink points to the newest session
3. Each service's stdout/stderr is written to a named log file (`api.log`, `worker.log`, etc.) and a `combined.log`
4. Old sessions beyond the limit are automatically pruned (default: keep 10)

### Framework plugins (Vite / Next.js)

1. On dev server start, a timestamped session directory is created (reused if one already exists from the CLI)
2. A small script is injected into your HTML that intercepts console methods
3. Captured logs are batched and sent to the dev server via `sendBeacon`
4. The server writes formatted log lines to `browser.log` in the session directory

<details>
<summary><strong>Where are files written?</strong></summary>

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

Each dev server start creates a new timestamped directory. The `latest` symlink always points to the most recent session, so `tmp/logs/latest/browser.log` is always the current log file. Old sessions are pruned automatically.

</details>

## Configuration

All options are optional with sensible defaults.

<details>
<summary><strong>Vite</strong></summary>

All options go in a single call — the plugin handles both server and client:

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

</details>

<details>
<summary><strong>Next.js</strong></summary>

Next.js doesn't have a unified plugin model, so options are split across two call sites depending on whether they affect the server or the client.

**Server-side options** go in the config wrapper (second argument):

```ts
// next.config.ts
import { with_browser_logs } from "next-plugin-agent-tail"

export default with_browser_logs(
    { /* your Next.js config */ },
    {
        logDir: "tmp/logs",             // Directory for log storage (relative to project root)
        logFileName: "browser.log",     // Log file name within each session
        maxLogSessions: 10,             // Max session directories to keep
        endpoint: "/__browser-logs",    // Server endpoint for log ingestion
        warnOnMissingGitignore: true,   // Warn if logDir isn't gitignored
    }
)
```

**Client-side options** go on the script component:

```tsx
// app/layout.tsx
import { BrowserLogsScript } from "next-plugin-agent-tail/script"

{process.env.NODE_ENV === "development" && (
    <BrowserLogsScript
        options={{
            flushInterval: 500,             // Client-side flush interval (ms)
            maxBatchSize: 50,               // Max batch size before immediate flush
            maxSerializeLength: 2000,       // Max serialized object length
            levels: ["log", "warn", "error", "info", "debug"],
            captureErrors: true,            // Capture unhandled window errors
            captureRejections: true,        // Capture unhandled promise rejections
        }}
    />
)}
```

The API route handler requires no configuration — it reads the log path from environment variables set by the config wrapper:

```ts
// app/api/__browser-logs/route.ts
export { POST } from "next-plugin-agent-tail/handler"
```

</details>

### .gitignore

Add your log directory to `.gitignore` to keep logs out of version control:

```
# .gitignore
tmp/
```

The plugin warns on startup if the log directory isn't gitignored. Disable with `warnOnMissingGitignore: false`.

### Log Format

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

### Captured Events

Beyond console methods, the plugin captures:

- **Unhandled errors** (`window.onerror`) — logged as `UNCAUGHT_ERROR`
- **Unhandled promise rejections** — logged as `UNHANDLED_REJECTION`

Disable with `captureErrors: false` and `captureRejections: false`.

## CLI: `agent-tail`

The `agent-tail` CLI wraps any dev server command (or commands!) and pipes their output into the unified log session. Install it from the core package:

```bash
npm install -D agent-tail-core
```

### `agent-tail run`

This is the primary entry point. It creates a fresh session, spawns all your services, and handles everything:

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

Works with a single service too — no need to reach for `wrap`:

```bash
npx agent-tail run 'api: uv run server'
```

### `agent-tail init` + `agent-tail wrap`

If you need more control over when the session is created or want to start services independently (e.g. in separate terminal tabs, from different scripts, or at different times), you can split session creation and command wrapping into two steps.

`init` creates a new session directory and prints the path. `wrap` runs a single command and pipes its output into the existing session. Unlike `run`, `wrap` does not create a new session — it reuses whatever session the `latest` symlink points to.

```bash
# Terminal 1: Create the session
npx agent-tail init

# Terminal 2: Wrap the API server (joins the session)
npx agent-tail wrap api -- uv run fastapi-server

# Terminal 3: Wrap the worker (joins the same session)
npx agent-tail wrap worker -- uv run celery-worker
```

This is also useful when a framework plugin (Vite or Next.js) already created the session — `wrap` detects it and writes to the same directory:

```bash
# Terminal 1: Vite creates the session on startup
npm run dev

# Terminal 2: Wrap additional services into the same session
npx agent-tail wrap api -- uv run fastapi-server
```

If no session exists when `wrap` is called, it creates one automatically.

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

### Use `init` + `wrap` for independent services

If you prefer running each service in its own terminal (see [`init` + `wrap`](#agent-tail-init--agent-tail-wrap) for details):

```bash
# Terminal 1: Start the frontend (creates the session)
npm run dev

# Terminal 2: Wrap the API server (joins the session)
npx agent-tail wrap api -- npm run dev:api

# Terminal 3: Wrap the worker (joins the same session)
npx agent-tail wrap worker -- uv run celery-worker

# Terminal 4: Tail everything
tail -f tmp/logs/latest/*.log
```

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

## Agent Setup

To get the most out of agent-tail, tell your AI agent where the logs are. Add a snippet like this to your project's agent instructions file (Claude Code uses `CLAUDE.md`, Amp uses `AGENTS.md`, Cursor uses `.cursorrules`, Pi uses `SKILLS.md`):

```markdown
## Dev Logs

All dev server output is piped to `tmp/logs/`. The latest session is
symlinked at `tmp/logs/latest/`. Each service gets its own log file
(e.g. `fe.log`, `api.log`) plus a `combined.log` with all output
interleaved. Browser console output (console.log, console.warn,
console.error, unhandled errors, unhandled promise rejections) is
automatically captured via a framework plugin during development.

When debugging, always check recent logs before guessing:

    grep -ri "error\|warn" tmp/logs/latest/
    tail -50 tmp/logs/latest/combined.log
```

This gives agents like Claude Code, Amp, and Pi passive context about where runtime truth lives, so they read logs instead of speculating.

## Why Files, Not MCP

Plain log files beat a protocol server for this use case. ([longer discussion](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/))

- **Universal** — works with any agent, any editor, `tail`, `grep`, `jq`, `awk`. MCP only works with agents that explicitly support it.
- **No moving parts** — `appendFile()` vs. a server process + protocol + tool registration + connection lifecycle. Any of those can fail silently.
- **Zero connection state** — the file is a persistent timeline, not a live stream you can miss. No "was I connected when the error happened?"
- **Composable** — pipe output through `grep`, chain with `awk`, redirect to another file, or process with code. MCP tool results have to pass through the agent's context window to be combined or persisted.
- **Token efficient** — reading a file costs nothing in tool descriptions. MCP servers register tool schemas that consume context on every turn (popular browser-tools MCP servers use 13–18k tokens just in tool definitions).
- **Deterministic for agents** — "read the last 200 lines of `tmp/logs/latest/browser.log`" beats hoping the model calls a tool correctly. Agents already know how to read files and use `grep`.
- **Human + AI see the same bytes** — no reformatting, no schema negotiation. "Check line 428" just works.
- **History for free** — full session history on disk. MCP sessions disappear after a crash. Agents reason better with context they can scroll back through.
- **Easy to extend** — changing the log format or adding a new log file is a one-line change. Extending an MCP server means understanding its codebase, protocol layer, and tool registration.
- **No permission friction** — reading a local file is passive context. MCP tools may need approval, rate limiting, or sandbox exceptions.
- **Works across every stack** — every language can append to a file. Not every stack has a clean MCP SDK.

That said, MCP has real strengths in other contexts. It provides structured, queryable interfaces that are useful for complex data sources (databases, APIs, search indexes) where flat files would be unwieldy. It also works in environments where the agent has no filesystem access, like cloud-hosted IDEs or remote sandboxes. For log capture specifically, files are the better fit — logs are inherently append-only text, and the entire Unix toolchain already exists to search, filter, and tail them.

## License

© 2026 Kyle Gill

MIT
