import type { LogEntry } from "./types"

export function format_log_line(entry: LogEntry): string {
    const time = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(7)
    const message = entry.args.join(" ")
    const location = entry.url ? ` (${entry.url})` : ""
    const stack = entry.stack
        ? `\n    ${entry.stack.split(/\r?\n/).join("\n    ")}`
        : ""
    return `[${time}] [${level}] ${message}${location}${stack}\n`
}
