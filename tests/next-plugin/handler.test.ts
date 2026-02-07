import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { POST, pages_handler } from "../../packages/next-plugin/src/handler"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "browser-logs-next-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

describe("Next.js handler", () => {
    let temp_dir: string
    let log_file: string

    beforeEach(() => {
        temp_dir = create_temp_dir()
        log_file = path.join(temp_dir, "browser.log")
        fs.writeFileSync(log_file, "")
        process.env.__BROWSER_LOGS_PATH = log_file
    })

    afterEach(() => {
        delete process.env.__BROWSER_LOGS_PATH
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    describe("POST (App Router)", () => {
        it("writes log entries and returns 204", async () => {
            const entries = [
                { level: "log", args: ["hello"], timestamp: "10:00:00.000" },
            ]
            const request = new Request("http://localhost/__browser-logs", {
                method: "POST",
                body: JSON.stringify(entries),
                headers: { "Content-Type": "application/json" },
            })

            const response = await POST(request)

            expect(response.status).toBe(204)
            const content = fs.readFileSync(log_file, "utf-8")
            expect(content).toContain("hello")
            expect(content).toContain("[LOG")
        })

        it("returns 500 when log path is not configured", async () => {
            delete process.env.__BROWSER_LOGS_PATH
            const request = new Request("http://localhost/__browser-logs", {
                method: "POST",
                body: JSON.stringify([]),
            })

            const response = await POST(request)

            expect(response.status).toBe(500)
        })

        it("returns 204 on malformed JSON", async () => {
            const request = new Request("http://localhost/__browser-logs", {
                method: "POST",
                body: "not json",
            })

            const response = await POST(request)

            expect(response.status).toBe(204)
        })
    })

    describe("pages_handler (Pages Router)", () => {
        it("writes log entries and returns 204", () => {
            const entries = [
                { level: "warn", args: ["warning!"], timestamp: "10:00:00.000" },
            ]
            const req = { method: "POST", body: entries }
            const end_fn = vi.fn()
            const res = { status: vi.fn(() => ({ end: end_fn })) }

            pages_handler(req, res)

            expect(res.status).toHaveBeenCalledWith(204)
            const content = fs.readFileSync(log_file, "utf-8")
            expect(content).toContain("warning!")
        })

        it("rejects non-POST with 405", () => {
            const req = { method: "GET" }
            const end_fn = vi.fn()
            const res = { status: vi.fn(() => ({ end: end_fn })) }

            pages_handler(req, res)

            expect(res.status).toHaveBeenCalledWith(405)
        })

        it("handles string body", () => {
            const entries = [
                { level: "info", args: ["parsed"], timestamp: "10:00:00.000" },
            ]
            const req = { method: "POST", body: JSON.stringify(entries) }
            const end_fn = vi.fn()
            const res = { status: vi.fn(() => ({ end: end_fn })) }

            pages_handler(req, res)

            const content = fs.readFileSync(log_file, "utf-8")
            expect(content).toContain("parsed")
        })
    })
})
