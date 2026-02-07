import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { EventEmitter } from "node:events"
import { agentTail } from "../../packages/vite-plugin/src/plugin"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "browser-logs-vite-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

describe("agentTail vite plugin", () => {
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
        const plugin = agentTail()
        expect(plugin.name).toBe("vite-plugin-agent-tail")
    })

    it("only applies during serve", () => {
        const plugin = agentTail()
        expect(plugin.apply).toBe("serve")
    })

    it("configures server middleware on the default endpoint", () => {
        const plugin = agentTail()
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
        const plugin = agentTail({ endpoint: "/__my-logs" })
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
        const plugin = agentTail()
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
        const plugin = agentTail()
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

    it("filters excluded entries server-side", () => {
        const plugin = agentTail({ excludes: ["noisy"] })
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
            { level: "log", args: ["keep this"], timestamp: "10:30:00.123" },
            { level: "log", args: ["noisy message"], timestamp: "10:30:00.456" },
            { level: "error", args: ["also keep"], timestamp: "10:30:00.789" },
        ]

        const req = new EventEmitter() as any
        req.method = "POST"
        const res = { writeHead: vi.fn(), end: vi.fn() }

        handler(req, res)
        req.emit("data", Buffer.from(JSON.stringify(log_entries)))
        req.emit("end")

        const log_dir = path.join(temp_dir, "tmp/logs")
        const latest = path.join(log_dir, "latest")
        const log_file = path.join(fs.realpathSync(latest), "browser.log")
        const content = fs.readFileSync(log_file, "utf-8")

        expect(content).toContain("keep this")
        expect(content).toContain("also keep")
        expect(content).not.toContain("noisy message")
    })

    it("transforms index HTML with script injection", () => {
        const plugin = agentTail()
        const result = (plugin as any).transformIndexHtml()

        expect(result).toHaveLength(1)
        expect(result[0].tag).toBe("script")
        expect(result[0].attrs.type).toBe("text/javascript")
        expect(result[0].injectTo).toBe("head-prepend")
        expect(result[0].children).toContain("sendBeacon")
        expect(result[0].children).toContain("/__browser-logs")
    })
})
