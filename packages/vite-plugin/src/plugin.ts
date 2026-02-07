import fs from "node:fs"
import type { Plugin } from "vite"
import type { BrowserLogsOptions, LogEntry } from "agent-tail-core"
import {
    resolve_options,
    format_log_line,
    LogManager,
    generate_client_script,
    should_exclude,
} from "agent-tail-core"

export function agentTail(user_options?: BrowserLogsOptions): Plugin {
    const options = resolve_options(user_options)
    const log_manager = new LogManager(options)
    let log_path: string

    return {
        name: "vite-plugin-agent-tail",
        apply: "serve",

        configureServer(server) {
            const project_root = server.config.root
            log_path = log_manager.initialize(project_root)

            server.middlewares.use(options.endpoint, (req, res) => {
                if (req.method !== "POST") {
                    res.writeHead(405)
                    res.end()
                    return
                }

                let body = ""
                req.on("data", (chunk: Buffer) => {
                    body += chunk.toString()
                })
                req.on("end", () => {
                    try {
                        let entries: LogEntry[] = JSON.parse(body)
                        if (options.excludes.length) {
                            entries = entries.filter(e => !should_exclude(e.args.join(" "), options.excludes))
                        }
                        const lines = entries.map(format_log_line).join("")
                        fs.appendFileSync(log_path, lines)
                    } catch {
                        // malformed payload, ignore
                    }
                    res.writeHead(204)
                    res.end()
                })
            })
        },

        transformIndexHtml() {
            return [
                {
                    tag: "script",
                    attrs: { type: "text/javascript" },
                    children: generate_client_script(options),
                    injectTo: "head-prepend" as const,
                },
            ]
        },
    }
}
