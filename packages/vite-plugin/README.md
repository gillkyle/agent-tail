# vite-plugin-agent-tail

Vite plugin for [agent-tail](https://agent-tail.vercel.app/) — captures browser `console.log`, `console.warn`, `console.error`, unhandled errors, and unhandled promise rejections to log files on disk during development.

## Install

```bash
npm install -D vite-plugin-agent-tail
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { agentTail } from "vite-plugin-agent-tail"

export default defineConfig({
    plugins: [agentTail()],
})
```

Then in another terminal:

```bash
tail -f tmp/logs/latest/browser.log
```

## How it works

The plugin injects a small script into your HTML that intercepts console methods, batches the output, and sends it to the dev server via `sendBeacon`. Logs are written to a timestamped session directory with a `latest` symlink for easy access.

## Pair with the CLI

Use both the plugin and the CLI to get browser console logs *and* server output in one place:

```bash
npx agent-tail-core run 'fe: npm run dev' 'api: uvicorn main:app'
```

## Docs

Full documentation and configuration options at **[agent-tail.vercel.app](https://agent-tail.vercel.app/)**

## License

MIT
