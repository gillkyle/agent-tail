# CLI Reference

## `agent-tail run`

Spawn one or more services with unified logging. Each argument is a `name: command` pair.

```bash
agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'
```

Creates a session directory, spawns all services, prefixes terminal output with `[name]`, and writes `<name>.log` + `combined.log`.

Works with any command — Python, Go, Ruby, whatever runs in a terminal:

```bash
agent-tail run 'api: uv run fastapi dev' 'fe: npm run dev'
```

## `agent-tail wrap`

Wrap a single command and write its output to a named log file in the current session:

```bash
agent-tail wrap server -- npm run dev
```

If a session already exists (created by `init` or a framework plugin), `wrap` reuses it. Otherwise it creates a new one.

## `agent-tail init`

Create a new log session directory without running any commands:

```bash
agent-tail init
```

Sets up the session directory and `latest` symlink. Useful when framework plugins or other tools will write to the session.

## Flags

All flags work with `run`, `wrap`, and `init`:

```
--log-dir <dir>       Log directory relative to cwd (default: tmp/logs)
--max-sessions <n>    Max sessions to keep (default: 10)
--no-combined         Don't write to combined.log
--exclude <pattern>   Exclude lines matching pattern (repeatable)
--mute <name>         Mute a service from terminal and combined.log (repeatable)
```

### `--exclude`

Filter log lines by content before they hit disk. Repeatable.

```bash
agent-tail run --exclude "[HMR]" --exclude "/^DEBUG/" 'fe: npm run dev'
```

Plain strings are substring matches. Patterns starting with `/` are parsed as regex.

### `--mute`

Hide entire services from terminal output and combined.log. Muted services still run and log to their individual `<name>.log` files.

```bash
agent-tail run --mute fe --mute worker 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'
```

Only `api` output appears in the terminal. All three services still write to `fe.log`, `api.log`, and `worker.log`.

> **--exclude** filters noisy log lines by content. **--mute** hides entire services by name.

## Multi-server aggregation

### Option 1: `agent-tail run` (recommended)

Run everything from one command:

```bash
agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'
```

### Option 2: Wrap services independently

Run each service in its own terminal. `wrap` detects the existing session:

```bash
# Terminal 1: Start the frontend (creates the session)
npm run dev

# Terminal 2: Wrap the API server (reuses the session)
npx agent-tail wrap api -- uv run fastapi-server

# Terminal 3: Tail everything
tail -f tmp/logs/latest/*.log
```
