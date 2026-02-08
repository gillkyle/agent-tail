import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { LogManager } from "./log-manager"
import { resolve_options } from "./types"
import { should_exclude } from "./filter"

const PREFIX = "\x1b[36m[agent-tail]\x1b[0m"

export interface CliOptions {
    log_dir: string
    max_sessions: number
    combined: boolean
    excludes: string[]
}

export const DEFAULT_CLI_OPTIONS: CliOptions = {
    log_dir: "tmp/logs",
    max_sessions: 10,
    combined: true,
    excludes: [],
}

export function create_manager(options: CliOptions): LogManager {
    return new LogManager(
        resolve_options({
            logDir: options.log_dir,
            maxLogSessions: options.max_sessions,
        })
    )
}

/**
 * Create a new log session. Returns the session directory path.
 */
export function cmd_init(
    project_root: string,
    options: CliOptions = DEFAULT_CLI_OPTIONS
): string {
    const manager = create_manager(options)
    const log_path = manager.initialize(project_root)
    return path.dirname(log_path)
}

/**
 * Resolve the current session directory (reuse if exists, create if not).
 */
export function resolve_session_dir(
    project_root: string,
    options: CliOptions = DEFAULT_CLI_OPTIONS
): string {
    const manager = create_manager(options)
    return manager.resolve_session(project_root)
}

export interface ServiceConfig {
    name: string
    command: string
}

export function parse_service_configs(args: string[]): ServiceConfig[] {
    return args.map((arg) => {
        const colon_index = arg.indexOf(":")
        if (colon_index === -1) {
            throw new Error(
                `Invalid service format "${arg}". Expected "name: command", e.g. "api: uv run server"`
            )
        }
        return {
            name: arg.slice(0, colon_index).trim(),
            command: arg.slice(colon_index + 1).trim(),
        }
    })
}

/**
 * Write data to a log stream and optionally to combined.log with a prefix.
 */
function write_to_logs(
    chunk: Buffer,
    name: string,
    log_stream: fs.WriteStream,
    combined_stream: fs.WriteStream | null,
    excludes: string[] = []
): void {
    const text = chunk.toString()
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            if (excludes.length && should_exclude(lines[i], excludes)) continue
            log_stream.write(lines[i] + "\n")
            if (combined_stream) {
                combined_stream.write(`[${name}] ${lines[i]}\n`)
            }
        } else if (i < lines.length - 1) {
            log_stream.write("\n")
            if (combined_stream) {
                combined_stream.write("\n")
            }
        }
    }
}

/**
 * Wrap a single command, piping its output to {name}.log in the session.
 * Returns a promise that resolves with the exit code.
 */
export function cmd_wrap(
    project_root: string,
    name: string,
    command: string[],
    options: CliOptions = DEFAULT_CLI_OPTIONS
): Promise<number> {
    if (!name) {
        throw new Error("wrap requires a service name")
    }
    if (command.length === 0) {
        throw new Error("wrap requires a command after --")
    }

    const session_dir = resolve_session_dir(project_root, options)

    const log_file = path.join(session_dir, `${name}.log`)
    const log_stream = fs.createWriteStream(log_file, { flags: "a" })

    let combined_stream: fs.WriteStream | null = null
    if (options.combined) {
        const combined_file = path.join(session_dir, "combined.log")
        combined_stream = fs.createWriteStream(combined_file, { flags: "a" })
    }

    console.log(`${PREFIX} ${name} → ${log_file}`)

    const child = spawn(command.join(" "), {
        stdio: ["inherit", "pipe", "pipe"],
        env: { ...process.env },
        shell: true,
    })

    child.stdout?.on("data", (chunk: Buffer) => {
        process.stdout.write(chunk)
        write_to_logs(chunk, name, log_stream, combined_stream, options.excludes)
    })
    child.stderr?.on("data", (chunk: Buffer) => {
        process.stderr.write(chunk)
        write_to_logs(chunk, name, log_stream, combined_stream, options.excludes)
    })

    return new Promise((resolve, reject) => {
        child.on("close", (code) => {
            log_stream.end()
            combined_stream?.end()
            resolve(code ?? 0)
        })

        child.on("error", (err) => {
            log_stream.end()
            combined_stream?.end()
            reject(err)
        })

        for (const signal of ["SIGINT", "SIGTERM"] as const) {
            process.on(signal, () => {
                child.kill(signal)
            })
        }
    })
}

const COLORS = [
    "\x1b[34m", // blue
    "\x1b[32m", // green
    "\x1b[33m", // yellow
    "\x1b[35m", // magenta
    "\x1b[36m", // cyan
    "\x1b[31m", // red
]
const RESET = "\x1b[0m"

/**
 * Run multiple services concurrently.
 * Returns a promise that resolves when all services exit.
 */
export function cmd_run(
    project_root: string,
    service_args: string[],
    options: CliOptions = DEFAULT_CLI_OPTIONS
): Promise<void> {
    if (service_args.length === 0) {
        throw new Error("run requires at least one service")
    }

    const services = parse_service_configs(service_args)
    const manager = create_manager(options)
    const log_path = manager.initialize(project_root)
    const session_dir = path.dirname(log_path)

    let combined_stream: fs.WriteStream | null = null
    if (options.combined) {
        const combined_file = path.join(session_dir, "combined.log")
        combined_stream = fs.createWriteStream(combined_file, { flags: "a" })
    }

    console.log(`${PREFIX} Session: ${session_dir}`)
    for (const svc of services) {
        console.log(`${PREFIX}   ${svc.name} → ${svc.name}.log`)
    }
    if (options.combined) {
        console.log(`${PREFIX}   combined → combined.log`)
    }
    console.log("")

    const children: ReturnType<typeof spawn>[] = []

    const promises = services.map((svc, i) => {
        const color = COLORS[i % COLORS.length]
        const tag = `${color}[${svc.name}]${RESET}`

        const log_file = path.join(session_dir, `${svc.name}.log`)
        const log_stream = fs.createWriteStream(log_file, { flags: "a" })

        const child = spawn(svc.command, {
            stdio: ["inherit", "pipe", "pipe"],
            env: { ...process.env },
            shell: true,
        })

        function handle(target: NodeJS.WriteStream, chunk: Buffer) {
            const text = chunk.toString()
            const lines = text.split(/\r?\n/)
            for (let j = 0; j < lines.length; j++) {
                if (lines[j].length > 0) {
                    if (options.excludes.length && should_exclude(lines[j], options.excludes)) continue
                    log_stream.write(lines[j] + "\n")
                    target.write(`${tag} ${lines[j]}\n`)
                    combined_stream?.write(`[${svc.name}] ${lines[j]}\n`)
                } else if (j < lines.length - 1) {
                    log_stream.write("\n")
                    target.write("\n")
                    combined_stream?.write("\n")
                }
            }
        }

        child.stdout?.on("data", (chunk: Buffer) =>
            handle(process.stdout, chunk)
        )
        child.stderr?.on("data", (chunk: Buffer) =>
            handle(process.stderr, chunk)
        )

        children.push(child)

        return new Promise<void>((resolve) => {
            child.on("close", (code) => {
                log_stream.end()
                if (code !== 0 && code !== null) {
                    console.log(`${tag} exited with code ${code}`)
                }
                resolve()
            })

            child.on("error", (err) => {
                console.error(`${tag} Failed to start: ${err.message}`)
                log_stream.end()
                resolve()
            })
        })
    })

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        process.on(signal, () => {
            for (const child of children) {
                child.kill(signal)
            }
        })
    }

    return Promise.all(promises).then(() => {
        combined_stream?.end()
    })
}
