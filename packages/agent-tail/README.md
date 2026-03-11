# agent-tail

Umbrella package for [agent-tail](https://agent-tail.vercel.app/) with the CLI, Vite plugin, and Next.js plugin in one install.

## Install

Project install:

```bash
npm install -D agent-tail
```

Global install:

```bash
npm install -g agent-tail
```

Global install only changes how you invoke the CLI. Logs still go to `tmp/logs/` in the current project by default.

## Quick start

```bash
tail -f tmp/logs/latest/*.log
tail -f tmp/logs/latest/browser.log

agent-tail run 'fe: npm run dev' 'api: uvicorn main:app'
agent-tail tail -f
agent-tail tail browser -n 50
```

Use plain `tail` if you want direct file paths. Use `agent-tail tail` if you want the CLI to resolve the latest session for you. It forwards the rest of the flags unchanged.

## Included exports

- CLI: `agent-tail`
- Vite plugin: `agent-tail/vite`
- Next.js plugin: `agent-tail/next`
- Next.js handler: `agent-tail/next/handler`
- Next.js script: `agent-tail/next/script`

## Docs

Full documentation, configuration options, and setup guides at **[agent-tail.vercel.app](https://agent-tail.vercel.app/)**.

## License

MIT
