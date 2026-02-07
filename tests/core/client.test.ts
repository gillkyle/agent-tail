import { describe, it, expect } from "vitest"
import { generate_client_script } from "../../packages/core/src/client"
import { DEFAULT_OPTIONS, resolve_options } from "../../packages/core/src/types"

describe("generate_client_script", () => {
    it("generates valid JavaScript", () => {
        const script = generate_client_script(DEFAULT_OPTIONS)
        expect(() => new Function(script)).not.toThrow()
    })

    it("injects custom endpoint", () => {
        const options = resolve_options({ endpoint: "/__custom-logs" })
        const script = generate_client_script(options)
        expect(script).toContain('"/__custom-logs"')
    })

    it("injects custom flush interval", () => {
        const options = resolve_options({ flushInterval: 1000 })
        const script = generate_client_script(options)
        expect(script).toContain("FLUSH_INTERVAL = 1000")
    })

    it("injects custom max batch size", () => {
        const options = resolve_options({ maxBatchSize: 100 })
        const script = generate_client_script(options)
        expect(script).toContain("MAX_BATCH = 100")
    })

    it("injects custom serialize length", () => {
        const options = resolve_options({ maxSerializeLength: 5000 })
        const script = generate_client_script(options)
        expect(script).toContain("MAX_SERIALIZE = 5000")
    })

    it("injects custom levels", () => {
        const options = resolve_options({ levels: ["log", "error"] })
        const script = generate_client_script(options)
        expect(script).toContain('["log","error"]')
    })

    it("respects captureErrors: false", () => {
        const options = resolve_options({ captureErrors: false })
        const script = generate_client_script(options)
        expect(script).toContain("CAPTURE_ERRORS = false")
    })

    it("respects captureRejections: false", () => {
        const options = resolve_options({ captureRejections: false })
        const script = generate_client_script(options)
        expect(script).toContain("CAPTURE_REJECTIONS = false")
    })

    it("uses all default options", () => {
        const script = generate_client_script(DEFAULT_OPTIONS)
        expect(script).toContain("FLUSH_INTERVAL = 500")
        expect(script).toContain("MAX_BATCH = 50")
        expect(script).toContain("MAX_SERIALIZE = 2000")
        expect(script).toContain('"/__browser-logs"')
        expect(script).toContain("CAPTURE_ERRORS = true")
        expect(script).toContain("CAPTURE_REJECTIONS = true")
    })
})
