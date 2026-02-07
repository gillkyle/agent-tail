import { describe, it, expect } from "vitest"
import { format_log_line } from "../../packages/core/src/formatter"
import type { LogEntry } from "../../packages/core/src/types"

describe("format_log_line", () => {
    it("formats a basic log entry", () => {
        const entry: LogEntry = {
            level: "log",
            args: ["hello", "world"],
            timestamp: "10:30:00.123",
        }
        const result = format_log_line(entry)
        expect(result).toBe("[10:30:00.123] [LOG    ] hello world\n")
    })

    it("pads short level names to 7 characters", () => {
        const entry: LogEntry = {
            level: "info",
            args: ["test"],
            timestamp: "10:30:00.123",
        }
        const result = format_log_line(entry)
        expect(result).toContain("[INFO   ]")
    })

    it("includes URL when present", () => {
        const entry: LogEntry = {
            level: "error",
            args: ["failed"],
            timestamp: "10:30:00.123",
            url: "http://localhost:5173/main.ts:42:10",
        }
        const result = format_log_line(entry)
        expect(result).toContain("(http://localhost:5173/main.ts:42:10)")
    })

    it("includes stack trace with indentation", () => {
        const entry: LogEntry = {
            level: "error",
            args: ["Error occurred"],
            timestamp: "10:30:00.123",
            stack: "Error: fail\n    at foo (main.ts:10)\n    at bar (main.ts:20)",
        }
        const result = format_log_line(entry)
        expect(result).toContain("\n    Error: fail")
        expect(result).toContain("\n        at foo")
    })

    it("handles empty args", () => {
        const entry: LogEntry = {
            level: "debug",
            args: [],
            timestamp: "10:30:00.123",
        }
        const result = format_log_line(entry)
        expect(result).toBe("[10:30:00.123] [DEBUG  ] \n")
    })

    it("handles uncaught_error level", () => {
        const entry: LogEntry = {
            level: "uncaught_error",
            args: ["Something broke"],
            timestamp: "10:30:00.123",
        }
        const result = format_log_line(entry)
        expect(result).toContain("UNCAUGHT_ERROR")
    })

    it("omits location when url is absent", () => {
        const entry: LogEntry = {
            level: "log",
            args: ["test"],
            timestamp: "10:30:00.123",
        }
        const result = format_log_line(entry)
        expect(result).not.toContain("(")
        expect(result).not.toContain(")")
    })
})
