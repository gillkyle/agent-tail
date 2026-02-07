import fs from "node:fs"
import path from "node:path"
import type { ResolvedOptions } from "./types"

const PLUGIN_PREFIX = "\x1b[36m[agent-tail]\x1b[0m"

let session_counter = 0

export class LogManager {
    constructor(private options: ResolvedOptions) {}

    initialize(project_root: string): string {
        const log_dir = path.resolve(project_root, this.options.logDir)
        let session_name = this.create_session_name()
        let session_dir = path.join(log_dir, session_name)

        // Ensure uniqueness if called multiple times in the same millisecond
        while (fs.existsSync(session_dir)) {
            session_counter++
            session_name = `${this.create_session_name()}-${session_counter}`
            session_dir = path.join(log_dir, session_name)
        }

        fs.mkdirSync(session_dir, { recursive: true })

        this.update_latest_symlink(log_dir, session_dir)
        this.prune_sessions(log_dir)

        const log_file = path.join(session_dir, this.options.logFileName)
        fs.writeFileSync(log_file, "")

        if (this.options.warnOnMissingGitignore) {
            this.check_gitignore(project_root)
        }

        console.log(`${PLUGIN_PREFIX} Writing to ${log_file}`)
        return log_file
    }

    create_session_name(): string {
        return new Date().toISOString().replace(/[:.]/g, "-")
    }

    update_latest_symlink(log_dir: string, session_dir: string): void {
        const latest_link = path.join(log_dir, "latest")
        try {
            fs.unlinkSync(latest_link)
        } catch {
            // doesn't exist yet
        }
        const relative_target = path.relative(log_dir, session_dir)
        fs.symlinkSync(relative_target, latest_link)
    }

    prune_sessions(log_dir: string): void {
        try {
            const entries = fs.readdirSync(log_dir, { withFileTypes: true })
            const session_dirs = entries
                .filter((e) => e.isDirectory() && e.name !== "latest")
                .map((e) => e.name)
                .sort()

            const to_remove = session_dirs.slice(
                0,
                Math.max(0, session_dirs.length - this.options.maxLogSessions)
            )
            for (const dir_name of to_remove) {
                const dir_path = path.join(log_dir, dir_name)
                fs.rmSync(dir_path, { recursive: true, force: true })
                console.log(`${PLUGIN_PREFIX} Pruned old session: ${dir_name}`)
            }
        } catch {
            // log dir might not exist yet
        }
    }

    /**
     * Resolve the current session directory. If a `latest` symlink exists and
     * points to a valid directory, return it. Otherwise create a new session.
     */
    resolve_session(project_root: string): string {
        const log_dir = path.resolve(project_root, this.options.logDir)
        const latest_link = path.join(log_dir, "latest")

        try {
            const real = fs.realpathSync(latest_link)
            if (fs.statSync(real).isDirectory()) {
                return real
            }
        } catch {
            // no valid session yet
        }

        const log_path = this.initialize(project_root)
        return path.dirname(log_path)
    }

    check_gitignore(project_root: string): void {
        const gitignore_path = path.join(project_root, ".gitignore")
        try {
            const content = fs.readFileSync(gitignore_path, "utf-8")
            const lines = content.split("\n").map((l) => l.trim())
            const log_dir = this.options.logDir

            const parts = log_dir.split("/")
            let covered = false
            for (let i = 1; i <= parts.length; i++) {
                const prefix = parts.slice(0, i).join("/")
                if (
                    lines.includes(prefix) ||
                    lines.includes(prefix + "/") ||
                    lines.includes("/" + prefix) ||
                    lines.includes("/" + prefix + "/")
                ) {
                    covered = true
                    break
                }
            }

            if (!covered) {
                console.warn(
                    `${PLUGIN_PREFIX} \x1b[33mWarning:\x1b[0m "${log_dir}" is not in your .gitignore. ` +
                        `Add "${log_dir}/" to your .gitignore to avoid committing log files.`
                )
            }
        } catch {
            console.warn(
                `${PLUGIN_PREFIX} \x1b[33mWarning:\x1b[0m No .gitignore found. ` +
                    `Consider adding one with "${this.options.logDir}/" to avoid committing log files.`
            )
        }
    }
}
