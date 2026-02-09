# Next.js Setup

## Install

```bash
npm install -D agent-tail
```

## 1. Wrap your Next.js config

```ts
// next.config.ts
import { withAgentTail } from "agent-tail/next"

export default withAgentTail({
    // your Next.js config
})
```

## 2. Add the script to your layout

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

## 3. Create the API route

```ts
// app/api/__browser-logs/route.ts
export { POST } from "agent-tail/next/handler"
```

## Configuration

Options are split between server-side (config wrapper) and client-side (script component).

### Server-side options

Pass as the second argument to `withAgentTail`:

```ts
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

### Client-side options

Pass via the `options` prop on the script component:

```tsx
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

The API route handler requires no configuration — it reads the log path from environment variables set by the config wrapper.
