import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { LogManager } from "../../packages/core/src/log-manager"
import { DEFAULT_OPTIONS } from "../../packages/core/src/types"
import type { ResolvedOptions } from "../../packages/core/src/types"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "browser-logs-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

describe("LogManager", () => {
    let temp_dir: string
    let options: ResolvedOptions

    beforeEach(() => {
        temp_dir = create_temp_dir()
        options = { ...DEFAULT_OPTIONS }
        vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    describe("initialize", () => {
        it("creates a session directory with timestamp name", () => {
            const manager = new LogManager(options)
            manager.initialize(temp_dir)

            const log_dir = path.join(temp_dir, options.logDir)
            const entries = fs.readdirSync(log_dir)
            const dirs = entries.filter((e) => {
                const full = path.join(log_dir, e)
                return (
                    fs.statSync(full).isDirectory() ||
                    (fs.lstatSync(full).isSymbolicLink() && e === "latest")
                )
            })
            expect(dirs.length).toBeGreaterThanOrEqual(2)
        })

        it("returns the full path to the log file", () => {
            const manager = new LogManager(options)
            const log_path = manager.initialize(temp_dir)

            expect(log_path).toContain(options.logFileName)
            expect(fs.existsSync(log_path)).toBe(true)
        })

        it("creates an empty log file", () => {
            const manager = new LogManager(options)
            const log_path = manager.initialize(temp_dir)

            expect(fs.readFileSync(log_path, "utf-8")).toBe("")
        })

        it("creates a latest symlink pointing to the session directory", () => {
            const manager = new LogManager(options)
            const log_path = manager.initialize(temp_dir)

            const log_dir = path.join(temp_dir, options.logDir)
            const latest_link = path.join(log_dir, "latest")
            expect(fs.lstatSync(latest_link).isSymbolicLink()).toBe(true)

            const resolved = fs.realpathSync(latest_link)
            const real_log_path = fs.realpathSync(log_path)
            expect(real_log_path.startsWith(resolved)).toBe(true)
        })

        it("updates the latest symlink on subsequent initializations", () => {
            const manager = new LogManager(options)
            const first_path = manager.initialize(temp_dir)
            const second_path = manager.initialize(temp_dir)

            const log_dir = path.join(temp_dir, options.logDir)
            const latest_link = path.join(log_dir, "latest")
            const resolved = fs.realpathSync(latest_link)
            const real_second = fs.realpathSync(second_path)

            expect(real_second.startsWith(resolved)).toBe(true)
            expect(path.dirname(first_path)).not.toBe(path.dirname(second_path))
        })

        it("uses custom logDir", () => {
            const custom = { ...options, logDir: "custom/log/path" }
            const manager = new LogManager(custom)
            const log_path = manager.initialize(temp_dir)

            expect(log_path).toContain("custom/log/path")
        })

        it("uses custom logFileName", () => {
            const custom = { ...options, logFileName: "custom.log" }
            const manager = new LogManager(custom)
            const log_path = manager.initialize(temp_dir)

            expect(log_path).toContain("custom.log")
        })
    })

    describe("prune_sessions", () => {
        it("keeps only maxLogSessions directories", () => {
            const custom = { ...options, maxLogSessions: 3 }
            const manager = new LogManager(custom)

            // Pre-create 5 session dirs with distinct timestamps
            const log_dir = path.join(temp_dir, options.logDir)
            fs.mkdirSync(log_dir, { recursive: true })
            for (let i = 0; i < 5; i++) {
                fs.mkdirSync(path.join(log_dir, `2024-01-0${i + 1}T00-00-00-000Z`))
            }

            // Initialize triggers pruning
            manager.initialize(temp_dir)

            const entries = fs.readdirSync(log_dir)
            const session_dirs = entries.filter((e) => {
                const full = path.join(log_dir, e)
                return e !== "latest" && fs.statSync(full).isDirectory()
            })

            expect(session_dirs.length).toBe(3)
        })

        it("removes oldest sessions first", () => {
            const custom = { ...options, maxLogSessions: 2 }
            const manager = new LogManager(custom)

            const log_dir = path.join(temp_dir, options.logDir)
            fs.mkdirSync(log_dir, { recursive: true })

            const old_dirs = [
                "2024-01-01T00-00-00-000Z",
                "2024-01-02T00-00-00-000Z",
                "2024-01-03T00-00-00-000Z",
            ]
            for (const d of old_dirs) {
                fs.mkdirSync(path.join(log_dir, d))
            }

            manager.initialize(temp_dir)

            const entries = fs.readdirSync(log_dir)
            const session_dirs = entries.filter((e) => {
                const full = path.join(log_dir, e)
                return e !== "latest" && fs.statSync(full).isDirectory()
            })

            expect(session_dirs.length).toBe(2)
            expect(session_dirs).not.toContain("2024-01-01T00-00-00-000Z")
            expect(session_dirs).not.toContain("2024-01-02T00-00-00-000Z")
        })
    })

    describe("join_session", () => {
        it("creates the log file in an existing session directory", () => {
            const manager = new LogManager(options)
            const session_dir = path.join(temp_dir, "tmp/logs/pre-existing-session")
            fs.mkdirSync(session_dir, { recursive: true })

            const log_path = manager.join_session(session_dir)

            expect(log_path).toBe(path.join(session_dir, "browser.log"))
            expect(fs.existsSync(log_path)).toBe(true)
        })

        it("does not overwrite an existing log file", () => {
            const manager = new LogManager(options)
            const session_dir = path.join(temp_dir, "tmp/logs/pre-existing-session")
            fs.mkdirSync(session_dir, { recursive: true })
            const log_file = path.join(session_dir, "browser.log")
            fs.writeFileSync(log_file, "existing content\n")

            const log_path = manager.join_session(session_dir)

            expect(fs.readFileSync(log_path, "utf-8")).toBe("existing content\n")
        })

        it("does not create a new session directory", () => {
            const manager = new LogManager(options)
            const log_dir = path.join(temp_dir, "tmp/logs")
            const session_dir = path.join(log_dir, "pre-existing-session")
            fs.mkdirSync(session_dir, { recursive: true })

            manager.join_session(session_dir)

            const entries = fs.readdirSync(log_dir)
            expect(entries).toEqual(["pre-existing-session"])
        })
    })

    describe("check_gitignore", () => {
        it("warns when logDir is not in .gitignore", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})
            fs.writeFileSync(
                path.join(temp_dir, ".gitignore"),
                "node_modules\ndist\n"
            )

            const manager = new LogManager(options)
            manager.check_gitignore(temp_dir)

            expect(warn_spy).toHaveBeenCalledWith(
                expect.stringContaining("not in your .gitignore")
            )
        })

        it("does not warn when logDir is in .gitignore", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})
            fs.writeFileSync(
                path.join(temp_dir, ".gitignore"),
                "node_modules\ntmp/logs\n"
            )

            const manager = new LogManager(options)
            manager.check_gitignore(temp_dir)

            expect(warn_spy).not.toHaveBeenCalled()
        })

        it("does not warn when parent dir covers logDir", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})
            fs.writeFileSync(path.join(temp_dir, ".gitignore"), "tmp/\n")

            const manager = new LogManager(options)
            manager.check_gitignore(temp_dir)

            expect(warn_spy).not.toHaveBeenCalled()
        })

        it("does not warn when parent dir with leading slash covers logDir", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})
            fs.writeFileSync(path.join(temp_dir, ".gitignore"), "/tmp\n")

            const manager = new LogManager(options)
            manager.check_gitignore(temp_dir)

            expect(warn_spy).not.toHaveBeenCalled()
        })

        it("warns when .gitignore does not exist", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})

            const manager = new LogManager(options)
            manager.check_gitignore(temp_dir)

            expect(warn_spy).toHaveBeenCalledWith(
                expect.stringContaining("No .gitignore found")
            )
        })

        it("skips check when warnOnMissingGitignore is false", () => {
            const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {})
            const custom = { ...options, warnOnMissingGitignore: false }
            const manager = new LogManager(custom)

            manager.initialize(temp_dir)

            expect(warn_spy).not.toHaveBeenCalled()
        })
    })
})
