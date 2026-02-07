import { describe, it, expect } from "vitest"

describe("agent-tail umbrella exports", () => {
    it("re-exports core utilities", async () => {
        const mod = await import("../../packages/agent-tail/src/index")
        expect(mod.format_log_line).toBeDefined()
        expect(mod.generate_client_script).toBeDefined()
        expect(mod.LogManager).toBeDefined()
        expect(mod.resolve_options).toBeDefined()
        expect(mod.DEFAULT_OPTIONS).toBeDefined()
        expect(mod.should_exclude).toBeDefined()
    })

    it("re-exports vite plugin", async () => {
        const mod = await import("../../packages/agent-tail/src/vite")
        expect(mod.browser_logs).toBeDefined()
        expect(typeof mod.browser_logs).toBe("function")
    })

    it("re-exports next plugin", async () => {
        const mod = await import("../../packages/agent-tail/src/next")
        expect(mod.with_browser_logs).toBeDefined()
        expect(typeof mod.with_browser_logs).toBe("function")
    })

    it("re-exports next handler", async () => {
        const mod = await import("../../packages/agent-tail/src/handler")
        expect(mod.POST).toBeDefined()
        expect(mod.pages_handler).toBeDefined()
    })

    it("re-exports next script component", async () => {
        const mod = await import("../../packages/agent-tail/src/script")
        expect(mod.BrowserLogsScript).toBeDefined()
    })
})
