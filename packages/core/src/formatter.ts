import type { LogEntry } from "./types"
import { strip_ansi_codes } from "./ansi"

export function format_log_line(entry: LogEntry): string {
    const time = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(7)
    const message = entry.args.map(strip_ansi_codes).join(" ")
    const location = entry.url ? ` (${strip_ansi_codes(entry.url)})` : ""
    const stack = entry.stack
        ? `\n    ${strip_ansi_codes(entry.stack).split(/\r?\n/).join("\n    ")}`
        : ""
    return `[${time}] [${level}] ${message}${location}${stack}\n`
}
