# next-plugin-agent-tail

Next.js plugin for [agent-tail](https://agent-tail.vercel.app/) — captures browser `console.log`, `console.warn`, `console.error`, unhandled errors, and unhandled promise rejections to log files on disk during development.

> **Tip:** Install the umbrella [`agent-tail`](https://www.npmjs.com/package/agent-tail) package to get the CLI, Vite plugin, and Next.js plugin in one install: `npm install -D agent-tail`

## Install

```bash
npm install -D agent-tail
```

## Setup

```ts
// next.config.ts
import { withAgentTail } from "agent-tail/next"

export default withAgentTail({
    // your Next.js config
})
```

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

```ts
// app/api/__browser-logs/route.ts
export { POST } from "agent-tail/next/handler"
```

Then in another terminal:

```bash
tail -f tmp/logs/latest/browser.log
```

## Pair with the CLI

Use both the plugin and the CLI to get browser console logs *and* server output in one place:

```bash
agent-tail run 'fe: npm run dev' 'api: uvicorn main:app'
```

## Docs

Full documentation and configuration options at **[agent-tail.vercel.app](https://agent-tail.vercel.app/)**

## License

MIT
