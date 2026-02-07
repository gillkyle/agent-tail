import { describe, it, expect } from "vitest"
import { resolve_options, DEFAULT_OPTIONS } from "../../packages/core/src/types"

describe("resolve_options", () => {
    it("returns defaults when no options provided", () => {
        const result = resolve_options()
        expect(result).toEqual(DEFAULT_OPTIONS)
    })

    it("returns defaults when empty object provided", () => {
        const result = resolve_options({})
        expect(result).toEqual(DEFAULT_OPTIONS)
    })

    it("overrides specific options while preserving defaults", () => {
        const result = resolve_options({ logDir: "my-logs", maxLogSessions: 5 })
        expect(result.logDir).toBe("my-logs")
        expect(result.maxLogSessions).toBe(5)
        expect(result.logFileName).toBe("browser.log")
        expect(result.endpoint).toBe("/__browser-logs")
        expect(result.flushInterval).toBe(500)
    })

    it("allows overriding all options", () => {
        const custom = {
            logDir: "custom",
            logFileName: "custom.log",
            maxLogSessions: 5,
            endpoint: "/custom",
            flushInterval: 1000,
            maxBatchSize: 100,
            maxSerializeLength: 5000,
            warnOnMissingGitignore: false,
            levels: ["log"],
            captureErrors: false,
            captureRejections: false,
            excludes: [],
        }
        const result = resolve_options(custom)
        expect(result).toEqual(custom)
    })
})
