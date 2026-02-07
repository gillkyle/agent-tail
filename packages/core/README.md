# agent-tail-core

CLI and shared core for [agent-tail](https://agent-tail.vercel.app/) — pipes server output and browser console logs to log files your AI coding agents can read and `grep`.

## Quick start

```bash
npx agent-tail-core run 'fe: npm run dev' 'api: uvicorn main:app'
```

Each service gets its own log file (`fe.log`, `api.log`) plus a `combined.log` with all output interleaved. A `latest` symlink always points to the current session:

```bash
tail -f tmp/logs/latest/combined.log
```

## CLI commands

- **`agent-tail run`** — spawn services with unified logging (recommended)
- **`agent-tail init`** — create a session directory
- **`agent-tail wrap`** — pipe a single command into an existing session

## Options

```
--log-dir <dir>       Log directory relative to cwd (default: tmp/logs)
--max-sessions <n>    Max sessions to keep (default: 10)
--no-combined         Don't write to combined.log
```

## Docs

Full documentation, configuration options, and framework plugin setup at **[agent-tail.vercel.app](https://agent-tail.vercel.app/)**

## License

MIT
