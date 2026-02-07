import { describe, it, expect } from "vitest"
import { should_exclude } from "../../packages/core/src/filter"

describe("should_exclude", () => {
    it("returns false for empty excludes array", () => {
        expect(should_exclude("hello world", [])).toBe(false)
    })

    it("matches substring patterns", () => {
        expect(should_exclude("hello world", ["world"])).toBe(true)
        expect(should_exclude("hello world", ["mars"])).toBe(false)
    })

    it("matches regex patterns (starting with /)", () => {
        expect(should_exclude("hello world", ["/^hello/"])).toBe(true)
        expect(should_exclude("say hello", ["/^hello/"])).toBe(false)
    })

    it("handles regex with special characters", () => {
        expect(should_exclude("error 404", ["/error \\d+/"])).toBe(true)
        expect(should_exclude("error abc", ["/error \\d+/"])).toBe(false)
    })

    it("skips invalid regex patterns", () => {
        expect(should_exclude("hello", ["/[invalid/"])).toBe(false)
    })

    it("matches with mixed substring and regex patterns", () => {
        expect(should_exclude("debug: loaded module", ["debug:", "/^warn/"])).toBe(true)
        expect(should_exclude("warn: something", ["debug:", "/^warn/"])).toBe(true)
        expect(should_exclude("info: ok", ["debug:", "/^warn/"])).toBe(false)
    })

    it("returns true on first match", () => {
        expect(should_exclude("test message", ["test", "message"])).toBe(true)
    })

    it("handles case-sensitive matching", () => {
        expect(should_exclude("Hello World", ["hello"])).toBe(false)
        expect(should_exclude("Hello World", ["Hello"])).toBe(true)
    })

    it("handles case-insensitive regex", () => {
        expect(should_exclude("Hello World", ["/hello/i"])).toBe(true)
    })
})
