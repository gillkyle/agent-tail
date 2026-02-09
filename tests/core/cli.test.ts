import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import {
    cmd_init,
    cmd_wrap,
    cmd_run,
    resolve_session_dir,
    parse_service_configs,
} from "../../packages/core/src/commands"
import type { CliOptions } from "../../packages/core/src/commands"
import { SESSION_ENV_VAR } from "../../packages/core/src/log-manager"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "agent-tail-cli-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

const DEFAULT_OPTS: CliOptions = {
    log_dir: "tmp/logs",
    max_sessions: 10,
    combined: true,
    excludes: [],
    mutes: [],
}

describe("CLI commands", () => {
    let temp_dir: string

    beforeEach(() => {
        temp_dir = create_temp_dir()
        fs.writeFileSync(path.join(temp_dir, ".gitignore"), "tmp/\n")
        vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    describe("cmd_init", () => {
        it("creates a session directory and returns the path", () => {
            const session_dir = cmd_init(temp_dir, DEFAULT_OPTS)

            expect(fs.existsSync(session_dir)).toBe(true)
            expect(fs.statSync(session_dir).isDirectory()).toBe(true)
        })

        it("creates a latest symlink", () => {
            cmd_init(temp_dir, DEFAULT_OPTS)

            const log_dir = path.join(temp_dir, "tmp/logs")
            const latest = path.join(log_dir, "latest")
            expect(fs.lstatSync(latest).isSymbolicLink()).toBe(true)
        })

        it("respects custom log_dir", () => {
            const opts = { ...DEFAULT_OPTS, log_dir: "custom/logs" }
            const session_dir = cmd_init(temp_dir, opts)

            expect(session_dir).toContain("custom/logs")
            const log_dir = path.join(temp_dir, "custom/logs")
            expect(fs.existsSync(path.join(log_dir, "latest"))).toBe(true)
        })
    })

    describe("resolve_session_dir", () => {
        it("creates a session if none exists", () => {
            const session_dir = resolve_session_dir(temp_dir, DEFAULT_OPTS)

            expect(fs.existsSync(session_dir)).toBe(true)
        })

        it("reuses an existing session", () => {
            const first = cmd_init(temp_dir, DEFAULT_OPTS)
            const second = resolve_session_dir(temp_dir, DEFAULT_OPTS)

            expect(fs.realpathSync(second)).toBe(fs.realpathSync(first))
        })
    })

    describe("cmd_wrap", () => {
        it("runs a command and creates the log file", async () => {
            cmd_init(temp_dir, DEFAULT_OPTS)

            // Suppress stdout during test
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const code = await cmd_wrap(
                temp_dir,
                "test-svc",
                ["echo", "hello from wrapped"],
                DEFAULT_OPTS
            )
            expect(code).toBe(0)

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const log_file = path.join(session_dir, "test-svc.log")

            expect(fs.existsSync(log_file)).toBe(true)
            const content = fs.readFileSync(log_file, "utf-8")
            expect(content).toContain("hello from wrapped")
        })

        it("writes to combined.log with service prefix", async () => {
            cmd_init(temp_dir, DEFAULT_OPTS)
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            await cmd_wrap(
                temp_dir,
                "svc",
                ["echo", "combined test"],
                DEFAULT_OPTS
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const combined = path.join(session_dir, "combined.log")

            expect(fs.existsSync(combined)).toBe(true)
            const content = fs.readFileSync(combined, "utf-8")
            expect(content).toContain("[svc]")
            expect(content).toContain("combined test")
        })

        it("skips combined.log when combined is false", async () => {
            const opts = { ...DEFAULT_OPTS, combined: false }
            cmd_init(temp_dir, opts)
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            await cmd_wrap(temp_dir, "svc", ["echo", "test"], opts)

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))

            expect(
                fs.existsSync(path.join(session_dir, "combined.log"))
            ).toBe(false)
        })

        it("throws when no name is provided", () => {
            expect(() =>
                cmd_wrap(temp_dir, "", ["echo"], DEFAULT_OPTS)
            ).toThrow("requires a service name")
        })

        it("throws when no command is provided", () => {
            expect(() =>
                cmd_wrap(temp_dir, "svc", [], DEFAULT_OPTS)
            ).toThrow("requires a command")
        })
    })

    describe("cmd_run", () => {
        it("runs multiple services and creates log files", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            await cmd_run(
                temp_dir,
                ["svc1: echo hello from svc1", "svc2: echo hello from svc2"],
                DEFAULT_OPTS
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))

            const svc1 = fs.readFileSync(
                path.join(session_dir, "svc1.log"),
                "utf-8"
            )
            const svc2 = fs.readFileSync(
                path.join(session_dir, "svc2.log"),
                "utf-8"
            )

            expect(svc1).toContain("hello from svc1")
            expect(svc2).toContain("hello from svc2")
        })

        it("creates combined.log with prefixed lines", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            await cmd_run(
                temp_dir,
                ["a: echo from-a", "b: echo from-b"],
                DEFAULT_OPTS
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const combined = fs.readFileSync(
                path.join(session_dir, "combined.log"),
                "utf-8"
            )

            expect(combined).toContain("[a]")
            expect(combined).toContain("[b]")
            expect(combined).toContain("from-a")
            expect(combined).toContain("from-b")
        })

        it("throws when no services provided", () => {
            expect(() => cmd_run(temp_dir, [], DEFAULT_OPTS)).toThrow(
                "requires at least one service"
            )
        })
    })

    describe("cmd_wrap with excludes", () => {
        it("filters excluded lines from log files", async () => {
            cmd_init(temp_dir, DEFAULT_OPTS)
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const opts = { ...DEFAULT_OPTS, excludes: ["secret"] }
            const code = await cmd_wrap(
                temp_dir,
                "filtered",
                ["printf 'public line\\nsecret data\\nanother line\\n'"],
                opts
            )
            expect(code).toBe(0)

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const log_file = path.join(session_dir, "filtered.log")
            const content = fs.readFileSync(log_file, "utf-8")

            expect(content).toContain("public line")
            expect(content).toContain("another line")
            expect(content).not.toContain("secret data")
        })
    })

    describe("cmd_run session env var", () => {
        it("passes AGENT_TAIL_SESSION to child processes", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            await cmd_run(
                temp_dir,
                [`svc: echo $${SESSION_ENV_VAR}`],
                DEFAULT_OPTS
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const log_file = path.join(session_dir, "svc.log")
            const content = fs.readFileSync(log_file, "utf-8")

            // Resolve both paths to handle macOS /var -> /private/var symlink
            expect(fs.realpathSync(content.trim())).toBe(session_dir)
        })
    })

    describe("cmd_run with excludes", () => {
        it("filters excluded lines from log files", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const opts = { ...DEFAULT_OPTS, excludes: ["noisy"] }
            await cmd_run(
                temp_dir,
                ["svc: printf 'keep this\\nnoisy output\\nalso keep\\n'"],
                opts
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const log_file = path.join(session_dir, "svc.log")
            const content = fs.readFileSync(log_file, "utf-8")

            expect(content).toContain("keep this")
            expect(content).toContain("also keep")
            expect(content).not.toContain("noisy output")
        })
    })

    describe("cmd_run with mute", () => {
        it("muted service still writes to its individual log file", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const opts = { ...DEFAULT_OPTS, mutes: ["quiet"] }
            await cmd_run(
                temp_dir,
                ["quiet: echo muted output"],
                opts
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const log_file = path.join(session_dir, "quiet.log")
            const content = fs.readFileSync(log_file, "utf-8")

            expect(content).toContain("muted output")
        })

        it("muted service is excluded from combined.log", async () => {
            vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const opts = { ...DEFAULT_OPTS, mutes: ["quiet"] }
            await cmd_run(
                temp_dir,
                ["loud: echo loud output", "quiet: echo quiet output"],
                opts
            )

            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = fs.realpathSync(path.join(log_dir, "latest"))
            const combined = path.join(session_dir, "combined.log")
            const content = fs.readFileSync(combined, "utf-8")

            expect(content).toContain("loud output")
            expect(content).not.toContain("quiet output")
        })

        it("muted service is excluded from terminal output", async () => {
            const write_spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

            const opts = { ...DEFAULT_OPTS, mutes: ["quiet"] }
            await cmd_run(
                temp_dir,
                ["loud: echo visible", "quiet: echo hidden"],
                opts
            )

            const terminal_output = write_spy.mock.calls.map(c => c[0].toString()).join("")

            expect(terminal_output).toContain("visible")
            expect(terminal_output).not.toContain("hidden")
        })
    })

    describe("parse_service_configs", () => {
        it("parses name:command format", () => {
            const result = parse_service_configs([
                "api: uv run server",
                "worker: python -m celery",
            ])

            expect(result).toEqual([
                { name: "api", command: "uv run server" },
                { name: "worker", command: "python -m celery" },
            ])
        })

        it("handles colons in command", () => {
            const result = parse_service_configs([
                "api: uvicorn app:main --host 0.0.0.0",
            ])

            expect(result).toEqual([
                { name: "api", command: "uvicorn app:main --host 0.0.0.0" },
            ])
        })

        it("throws on invalid format", () => {
            expect(() => parse_service_configs(["no-colon"])).toThrow(
                "Invalid service format"
            )
        })
    })
})
