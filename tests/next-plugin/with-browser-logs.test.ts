import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { withAgentTail } from "../../packages/next-plugin/src/with-browser-logs"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "browser-logs-next-cfg-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

describe("withAgentTail", () => {
    let temp_dir: string
    let original_cwd: () => string

    beforeEach(() => {
        temp_dir = create_temp_dir()
        fs.writeFileSync(path.join(temp_dir, ".gitignore"), "tmp/\n")
        original_cwd = process.cwd
        process.cwd = () => temp_dir
        vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        process.cwd = original_cwd
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    it("returns a config with env variables set", () => {
        const config = withAgentTail({})

        expect(config.env?.__BROWSER_LOGS_ENDPOINT).toBe("/__browser-logs")
        expect(config.env?.__BROWSER_LOGS_PATH).toBeTruthy()
        expect(config.env?.__BROWSER_LOGS_PATH).toContain("browser.log")
    })

    it("preserves existing next config properties", () => {
        const config = withAgentTail({
            reactStrictMode: true,
            env: { CUSTOM: "value" },
        })

        expect(config.reactStrictMode).toBe(true)
        expect(config.env?.CUSTOM).toBe("value")
        expect(config.env?.__BROWSER_LOGS_ENDPOINT).toBe("/__browser-logs")
    })

    it("creates the log directory structure", () => {
        withAgentTail({})

        const log_dir = path.join(temp_dir, "tmp/logs")
        expect(fs.existsSync(log_dir)).toBe(true)

        const latest = path.join(log_dir, "latest")
        expect(fs.lstatSync(latest).isSymbolicLink()).toBe(true)
    })

    it("preserves existing webpack config", () => {
        const custom_webpack = vi.fn((config: any) => ({
            ...config,
            custom: true,
        }))
        const config = withAgentTail({ webpack: custom_webpack })

        const result = config.webpack!({ entry: {} }, {})
        expect(custom_webpack).toHaveBeenCalled()
        expect(result.custom).toBe(true)
    })

    it("uses custom options", () => {
        const config = withAgentTail({}, { endpoint: "/__custom" })

        expect(config.env?.__BROWSER_LOGS_ENDPOINT).toBe("/__custom")
    })
})
