import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { EventEmitter } from "node:events"
import { browser_logs } from "../../packages/vite-plugin/src/plugin"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "browser-logs-vite-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

describe("browser_logs vite plugin", () => {
    let temp_dir: string

    beforeEach(() => {
        temp_dir = create_temp_dir()
        fs.writeFileSync(path.join(temp_dir, ".gitignore"), "tmp/\n")
    })

    afterEach(() => {
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    it("returns a plugin with correct name", () => {
        const plugin = browser_logs()
        expect(plugin.name).toBe("vite-plugin-agent-tail")
    })

    it("only applies during serve", () => {
        const plugin = browser_logs()
        expect(plugin.apply).toBe("serve")
    })

    it("configures server middleware on the default endpoint", () => {
        const plugin = browser_logs()
        const middlewares: Array<[string, Function]> = []
        const mock_server = {
            config: { root: temp_dir },
            middlewares: {
                use: (p: string, handler: Function) => {
                    middlewares.push([p, handler])
                },
            },
        }

        vi.spyOn(console, "log").mockImplementation(() => {})
        ;(plugin as any).configureServer(mock_server)

        expect(middlewares.length).toBe(1)
        expect(middlewares[0][0]).toBe("/__browser-logs")
    })

    it("uses custom endpoint", () => {
        const plugin = browser_logs({ endpoint: "/__my-logs" })
        const middlewares: Array<[string, Function]> = []
        const mock_server = {
            config: { root: temp_dir },
            middlewares: {
                use: (p: string, handler: Function) => {
                    middlewares.push([p, handler])
                },
            },
        }

        vi.spyOn(console, "log").mockImplementation(() => {})
        ;(plugin as any).configureServer(mock_server)

        expect(middlewares[0][0]).toBe("/__my-logs")
    })

    it("writes log entries to the log file via POST", () => {
        const plugin = browser_logs()
        let handler: Function = () => {}
        const mock_server = {
            config: { root: temp_dir },
            middlewares: {
                use: (_p: string, h: Function) => {
                    handler = h
                },
            },
        }

        vi.spyOn(console, "log").mockImplementation(() => {})
        ;(plugin as any).configureServer(mock_server)

        const log_entries = [
            { level: "log", args: ["hello world"], timestamp: "10:30:00.123" },
            {
                level: "error",
                args: ["something failed"],
                timestamp: "10:30:01.456",
            },
        ]

        const req = new EventEmitter() as any
        req.method = "POST"

        const res = {
            writeHead: vi.fn(),
            end: vi.fn(),
        }

        handler(req, res)
        req.emit("data", Buffer.from(JSON.stringify(log_entries)))
        req.emit("end")

        expect(res.writeHead).toHaveBeenCalledWith(204)

        const log_dir = path.join(temp_dir, "tmp/logs")
        const latest = path.join(log_dir, "latest")
        const log_file = path.join(fs.realpathSync(latest), "browser.log")
        const content = fs.readFileSync(log_file, "utf-8")

        expect(content).toContain("hello world")
        expect(content).toContain("something failed")
        expect(content).toContain("[LOG")
        expect(content).toContain("[ERROR")
    })

    it("rejects non-POST requests with 405", () => {
        const plugin = browser_logs()
        let handler: Function = () => {}
        const mock_server = {
            config: { root: temp_dir },
            middlewares: {
                use: (_p: string, h: Function) => {
                    handler = h
                },
            },
        }

        vi.spyOn(console, "log").mockImplementation(() => {})
        ;(plugin as any).configureServer(mock_server)

        const req = { method: "GET" }
        const res = { writeHead: vi.fn(), end: vi.fn() }

        handler(req, res)

        expect(res.writeHead).toHaveBeenCalledWith(405)
    })

    it("transforms index HTML with script injection", () => {
        const plugin = browser_logs()
        const result = (plugin as any).transformIndexHtml()

        expect(result).toHaveLength(1)
        expect(result[0].tag).toBe("script")
        expect(result[0].attrs.type).toBe("text/javascript")
        expect(result[0].injectTo).toBe("head-prepend")
        expect(result[0].children).toContain("sendBeacon")
        expect(result[0].children).toContain("/__browser-logs")
    })
})
