import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { EventEmitter } from "node:events"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const spawn_mock = vi.hoisted(() => vi.fn())

vi.mock("node:child_process", () => ({
    spawn: spawn_mock,
}))

import {
    cmd_init,
    cmd_tail,
    resolve_tail_paths,
} from "../../packages/core/src/commands"
import type { CliOptions } from "../../packages/core/src/commands"

function create_temp_dir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "agent-tail-tail-test-"))
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true })
}

function create_child_process(exit_code = 0) {
    const child = new EventEmitter() as EventEmitter & {
        kill: ReturnType<typeof vi.fn>
    }
    child.kill = vi.fn()
    queueMicrotask(() => {
        child.emit("close", exit_code)
    })
    return child
}

const DEFAULT_OPTS: CliOptions = {
    log_dir: "tmp/logs",
    max_sessions: 10,
    combined: true,
    excludes: [],
    mutes: [],
}

describe("tail command", () => {
    let temp_dir: string

    beforeEach(() => {
        temp_dir = create_temp_dir()
        fs.writeFileSync(path.join(temp_dir, ".gitignore"), "tmp/\n")
        vi.spyOn(console, "log").mockImplementation(() => {})
        spawn_mock.mockReset()
    })

    afterEach(() => {
        cleanup(temp_dir)
        vi.restoreAllMocks()
    })

    it("resolves every log file in the latest session by default", () => {
        cmd_init(temp_dir, DEFAULT_OPTS)

        const session_dir = fs.realpathSync(
            path.join(temp_dir, "tmp/logs/latest")
        )
        fs.writeFileSync(path.join(session_dir, "api.log"), "api\n")
        fs.writeFileSync(path.join(session_dir, "combined.log"), "combined\n")
        fs.writeFileSync(path.join(session_dir, "notes.txt"), "ignore\n")

        expect(
            resolve_tail_paths(temp_dir, {
                log_dir: "tmp/logs",
                tail_args: [],
            })
        ).toEqual([
            path.join(session_dir, "api.log"),
            path.join(session_dir, "browser.log"),
            path.join(session_dir, "combined.log"),
        ])
    })

    it("resolves exact and partial log name matches", () => {
        cmd_init(temp_dir, DEFAULT_OPTS)

        const session_dir = fs.realpathSync(
            path.join(temp_dir, "tmp/logs/latest")
        )
        fs.writeFileSync(path.join(session_dir, "api.log"), "api\n")
        fs.writeFileSync(path.join(session_dir, "api-worker.log"), "worker\n")

        expect(
            resolve_tail_paths(temp_dir, {
                log_dir: "tmp/logs",
                query: "api",
                tail_args: [],
            })
        ).toEqual([path.join(session_dir, "api.log")])

        expect(
            resolve_tail_paths(temp_dir, {
                log_dir: "tmp/logs",
                query: "worker",
                tail_args: [],
            })
        ).toEqual([path.join(session_dir, "api-worker.log")])
    })

    it("forwards tail args and resolved paths to the system tail command", async () => {
        cmd_init(temp_dir, DEFAULT_OPTS)

        const session_dir = fs.realpathSync(
            path.join(temp_dir, "tmp/logs/latest")
        )
        fs.writeFileSync(path.join(session_dir, "combined.log"), "combined\n")

        spawn_mock.mockReturnValue(create_child_process(0))

        const code = await cmd_tail(temp_dir, {
            log_dir: "tmp/logs",
            query: "combined",
            tail_args: ["-n", "25", "-f"],
        })

        expect(code).toBe(0)
        expect(spawn_mock).toHaveBeenCalledWith(
            "tail",
            ["-n", "25", "-f", path.join(session_dir, "combined.log")],
            { stdio: "inherit" }
        )
    })

    it("throws a friendly error when no latest session exists", () => {
        expect(() =>
            resolve_tail_paths(temp_dir, {
                log_dir: "tmp/logs",
                tail_args: [],
            })
        ).toThrow('No log session found in')
    })
})
