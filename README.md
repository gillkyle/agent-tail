# &>> agent-tail

Pipe dev server and browser console logs to log files on your machine that AI coding agents like Claude Code, Amp, and Cursor can read and grep.

[Documentation](https://agent-tail.vercel.app/)

![agent-tail demo](https://github.com/gillkyle/agent-tail/raw/refs/heads/main/assets/agent-tail-demo.gif)

**Try it!**

```bash
npx agent-tail run 'server: echo "Hello world!"' && cat tmp/logs/latest/server.log
```

That's the full cycle: run a command, output is captured to a log file, read the file.

## Table of Contents

- [Server-side and client-side logs](#server-side-and-client-side-logs)
- [Installation](#installation) — [CLI](#cli-server-side-logs) | [Vite](#vite-plugin-browser-logs) | [Next.js](#nextjs-plugin-browser-logs)
- [Packages](#packages)
- [Features](#features) — [Log filtering](#log-filtering) | [Multi-server](#multi-server-log-aggregation) | [Searching and tailing](#searching-and-tailing-logs) | [Captured events](#captured-browser-events) | [Session management](#session-management)
- [How agents use it](#how-agents-use-it)
- [Agent Setup](#agent-setup)
- [Configuration](#configuration) — [Vite](#vite-1) | [Next.js](#nextjs-1) | [CLI Options](#cli-options)
- [CLI Commands](#cli-commands)
- [Why Files, Not MCP](#why-files-not-mcp)
- [FAQ](#faq)

## Server-side and client-side logs

agent-tail captures two kinds of logs: **server-side** output (stdout/stderr from your dev commands) and **client-side** output (browser `console.*` calls). The CLI handles server logs and works with any stack. Framework plugins for Vite and Next.js handle browser logs. Use them together to get everything in one place.

```bash
agent-tail run 'fe: npm run dev' 'api: uv run server'
# tmp/logs/latest/fe.log        — Vite server output
# tmp/logs/latest/browser.log   — browser console (via plugin)
# tmp/logs/latest/api.log       — API server output
# tmp/logs/latest/combined.log  — everything interleaved
```

## Installation

### CLI (server-side logs)

The CLI wraps any command and captures its stdout/stderr to log files. No plugins, no config — works with any language or framework.

```bash
npm install -D agent-tail
```

Wrap one or more commands with unified logging in your `package.json`:

```json
{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'"
    }
}
```

Creates a session directory, spawns all services, prefixes output with `[name]`, and writes individual + combined log files.

It works with any command, not just Node — Python, Go, Ruby, whatever you run in a terminal:

```bash
npx agent-tail run 'api: uv run fastapi dev'
```

### Vite plugin (browser logs)

The Vite plugin captures browser `console.*` calls by injecting a small script into your page during development. Logs are written to `browser.log` in the same session directory the CLI uses.

```bash
npm install -D agent-tail
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [agentTail()],
})
```

Then in another terminal:

```bash
tail -f tmp/logs/latest/browser.log
```

### Next.js plugin (browser logs)

The Next.js plugin does the same thing — captures browser `console.*` output — but requires a bit more wiring because of how Next.js handles config, layouts, and API routes.

```bash
npm install -D agent-tail
```

**1. Wrap your Next.js config**

```ts
// next.config.ts
import { withAgentTail } from "agent-tail/next"

export default withAgentTail({
    // your Next.js config
})
```

**2. Add the script to your layout**

```tsx
// app/layout.tsx
import { AgentTailScript } from "agent-tail/next/script"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                {process.env.NODE_ENV === "development" && <AgentTailScript />}
            </head>
            <body>{children}</body>
        </html>
    )
}
```

**3. Create the API route**

```ts
// app/api/__browser-logs/route.ts
export { POST } from "agent-tail/next/handler"
```

### .gitignore

Add your log directory to `.gitignore`:

```
# .gitignore
tmp/
```

agent-tail warns on startup if the log directory isn't gitignored. Disable with `warnOnMissingGitignore: false`.

## Packages

Install the umbrella package to get everything:

```bash
npm install -D agent-tail
```

| Package | Description |
|---------|-------------|
| [`agent-tail`](./packages/agent-tail) | Umbrella package — includes CLI, Vite plugin, and Next.js plugin |
| [`agent-tail-core`](./packages/core) | CLI and shared core (types, formatting, log management) |
| [`vite-plugin-agent-tail`](./packages/vite-plugin) | Vite plugin — browser console capture |
| [`next-plugin-agent-tail`](./packages/next-plugin) | Next.js plugin — browser console capture |

## Features

### Readable, greppable logs

Logs are plain text files with a consistent format. Timestamps, levels, source locations, and stack traces are all there — easy for you to scan and easy for an AI to parse.

```
[10:30:00.123] [LOG    ] User clicked button
[10:30:00.456] [WARN   ] Deprecated API call
[10:30:01.789] [ERROR  ] Failed to fetch data (http://localhost:5173/src/api.ts:42:10)
    Error: Network error
        at fetchData (http://localhost:5173/src/api.ts:42:10)
        at handleClick (http://localhost:5173/src/app.ts:15:5)
```

Levels are padded to 7 characters for alignment. Stack traces are indented. Source URLs are included for errors.

### Log filtering

Not every log line is useful — HMR updates, noisy debug output, and framework internals add clutter that wastes AI context. The `excludes` option lets you filter them out before they hit disk.

```ts
// vite.config.ts
agentTail({
    excludes: [
        "[HMR]",           // substring match
        "Download the React DevTools",
        "/^\\[vite\\]/",     // regex match
    ],
})
```

The CLI supports it too, with repeatable `--exclude` flags:

```bash
agent-tail run --exclude "[HMR]" --exclude "/^DEBUG/" 'fe: npm run dev'
```

Plain strings are substring matches. Patterns starting with `/` are parsed as regex (e.g. `/^HMR/i`).

### Multi-server log aggregation

Most projects run more than one process — a frontend, an API, maybe a worker. agent-tail can aggregate all of them into one session directory.

**1. Use `agent-tail run` (recommended)**

Run everything from one command. All output goes to the same session automatically.

**2. Wrap services independently**

Run each service in its own terminal. The `wrap` command detects the existing session:

```bash
# Terminal 1: Start the frontend (creates the session)
npm run dev

# Terminal 2: Wrap the API server (reuses the session)
npx agent-tail wrap api -- uv run fastapi-server

# Terminal 3: Tail everything
tail -f tmp/logs/latest/*.log
```

**3. Direct file writes (no CLI needed)**

Point your server's logging at the `latest` symlink. Works with any language:

<details>
<summary>Python, Node.js, Ruby, Go examples</summary>

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

</details>

### Searching and tailing logs

Because logs are plain files, every standard Unix tool works out of the box:

```bash
# Follow all logs in real time
tail -f tmp/logs/latest/*.log

# Follow a specific service
tail -f tmp/logs/latest/browser.log

# Find all errors across every service
grep -r "ERROR" tmp/logs/latest/

# Case-insensitive search
grep -ri "failed\|timeout\|exception" tmp/logs/latest/

# Show context around each match
grep -r -C 5 "ERROR" tmp/logs/latest/

# Only ERROR and WARN lines
awk '/\[ERROR|\[WARN/' tmp/logs/latest/browser.log

# Count errors per service
grep -rc "ERROR" tmp/logs/latest/

# Use ripgrep for faster searches
rg "ERROR|WARN" tmp/logs/latest/
```

### Captured browser events

The framework plugins capture more than just `console.*` calls:

- **Unhandled errors** (`window.onerror`) — logged as `UNCAUGHT_ERROR` with full stack traces
- **Unhandled promise rejections** — logged as `UNHANDLED_REJECTION`

These are the errors that silently break your app in the browser. Disable with `captureErrors: false` and `captureRejections: false`.

### Session management

Each `agent-tail run` (or dev server start with a framework plugin) creates a new session — a timestamped directory under `tmp/logs/` that holds all log files for that run. A `latest` symlink always points to the most recent session, so `tmp/logs/latest/` is always the right path to give your agent.

- **Timestamped directories** — e.g. `2024-01-15T10-30-00-123Z/`
- **Latest symlink** — updated on every new session, always points to the newest one
- **Auto-pruning** — old sessions beyond the limit are removed (default: keep 10)
- **Gitignore detection** — warns if your log directory isn't in `.gitignore`

## How agents use it

agent-tail works best with AI tools that have access to your codebase — Claude Code, Cursor, Amp, and others. When your agent reads the log files, it gets:

- Timestamped errors with source locations
- Stack traces to trace the call path
- Server and browser output side by side
- The exact error message — no paraphrasing, no guessing

**Without agent-tail**, you copy-paste from browser devtools, describe the error in prose ("there's a 500 on the users page"), and hope the agent guesses right. Or you install an MCP browser tool that requires a running connection, can't be piped through `grep`, and gives you structured results you can't compose with other tools.

**With agent-tail**, every time you start your dev server, agent-tail creates a new session directory and symlinks `tmp/logs/latest/` to it. The agent runs `grep ERROR tmp/logs/latest/` and gets the exact stack trace, source file, and line number. Plain files — no connection state, no tool registration, no token overhead. Agents already know how to read files.

## Agent Setup

Add a section to your project's agent instructions file (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, or equivalent):

```markdown
## Dev Logs

All dev server output is captured to `tmp/logs/`. The latest session
is symlinked at `tmp/logs/latest/`.

When debugging, check logs before guessing about runtime behavior, ie:

    grep -ri "error\|warn" tmp/logs/latest/
    tail -50 tmp/logs/latest/browser.log
```

That's all. The agent now knows where runtime truth lives and can read logs instead of asking you to describe what went wrong.

## Configuration

All options are optional with sensible defaults.

<details>
<summary><strong>Vite</strong></summary>

All options go in a single call — the plugin handles both server and client:

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

</details>

<details>
<summary><strong>Next.js</strong></summary>

Next.js doesn't have a unified plugin model, so options are split across two call sites depending on whether they affect the server or the client.

**Server-side options** go in the config wrapper (second argument):

```ts
// next.config.ts
import { withAgentTail } from "agent-tail/next"

export default withAgentTail(
    { /* your Next.js config */ },
    {
        logDir: "tmp/logs",             // Directory for log storage (relative to project root)
        logFileName: "browser.log",     // Log file name within each session
        maxLogSessions: 10,             // Max session directories to keep
        endpoint: "/__browser-logs",    // Server endpoint for log ingestion
        warnOnMissingGitignore: true,   // Warn if logDir isn't gitignored
        excludes: [],                   // Patterns to exclude (substring or /regex/)
    }
)
```

**Client-side options** go on the script component:

```tsx
// app/layout.tsx
import { AgentTailScript } from "agent-tail/next/script"

{process.env.NODE_ENV === "development" && (
    <AgentTailScript
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
export { POST } from "agent-tail/next/handler"
```

</details>

### CLI Options

```
--log-dir <dir>       Log directory relative to cwd (default: tmp/logs)
--max-sessions <n>    Max sessions to keep (default: 10)
--no-combined         Don't write to combined.log
--exclude <pattern>   Exclude lines matching pattern (repeatable, /regex/ or substring)
```

## CLI Commands

### `agent-tail run`

Spawn one or more commands with unified logging. Each argument is a `name: command` pair:

```bash
agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'
```

Creates a session directory, spawns all services, prefixes output with `[name]`, and writes individual + combined log files.

### `agent-tail wrap`

Wrap a single command and write its output to a named log file in the current session:

```bash
agent-tail wrap server -- npm run dev
```

Useful when you want to add a service to an existing session created by `agent-tail init` or a framework plugin.

### `agent-tail init`

Create a new log session directory without running any commands:

```bash
agent-tail init
```

Sets up the session directory and `latest` symlink. Useful when other tools (like framework plugins) will write to the session.

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

## FAQ

See the [full FAQ](https://agent-tail.vercel.app/faq) on the docs site.

**Which package should I install?** Install `agent-tail` — it's the umbrella package that includes the CLI, Vite plugin, and Next.js plugin. One install, all features.

**Can I install the smaller packages separately?** Yes. `agent-tail-core` for CLI only, `vite-plugin-agent-tail` for Vite only, `next-plugin-agent-tail` for Next.js only. The umbrella re-exports everything.

## License

© 2026 Kyle Gill

MIT
