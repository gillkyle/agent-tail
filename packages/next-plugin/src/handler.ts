import fs from "node:fs"
import type { LogEntry } from "agent-tail-core"
import { format_log_line } from "agent-tail-core"

/**
 * Next.js App Router API route handler.
 *
 * Usage in app/api/__browser-logs/route.ts:
 *   export { POST } from "next-plugin-browser-logs/handler"
 */
export async function POST(request: Request): Promise<Response> {
    const log_path = process.env.__BROWSER_LOGS_PATH
    if (!log_path) {
        return new Response("Browser logs not configured", { status: 500 })
    }

    try {
        const entries: LogEntry[] = await request.json()
        const lines = entries.map(format_log_line).join("")
        fs.appendFileSync(log_path, lines)
        return new Response(null, { status: 204 })
    } catch {
        return new Response(null, { status: 204 })
    }
}

/**
 * Pages Router API route handler.
 *
 * Usage in pages/api/__browser-logs.ts:
 *   export default pages_handler
 */
export function pages_handler(
    req: { method?: string; body?: any },
    res: { status: (code: number) => { end: () => void } }
): void {
    if (req.method !== "POST") {
        res.status(405).end()
        return
    }

    const log_path = process.env.__BROWSER_LOGS_PATH
    if (!log_path) {
        res.status(500).end()
        return
    }

    try {
        const entries: LogEntry[] =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body
        const lines = entries.map(format_log_line).join("")
        fs.appendFileSync(log_path, lines)
    } catch {
        // malformed payload, ignore
    }
    res.status(204).end()
}
