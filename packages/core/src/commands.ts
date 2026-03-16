import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { strip_ansi_codes } from "./ansi"
import { LogManager, SESSION_ENV_VAR } from "./log-manager"
import { resolve_options } from "./types"
import { should_exclude } from "./filter"

const PREFIX = "\x1b[36m[agent-tail]\x1b[0m"

function get_child_env(session_dir: string): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        [SESSION_ENV_VAR]: session_dir,
    }

    if (env.NO_COLOR !== undefined || env.FORCE_COLOR === "0") {
        return env
    }

    env.FORCE_COLOR = env.FORCE_COLOR ?? "1"
    env.CLICOLOR_FORCE = env.CLICOLOR_FORCE ?? "1"
    return env
}

function end_stream(stream: fs.WriteStream | null): Promise<void> {
    if (!stream) return Promise.resolve()

    return new Promise((resolve, reject) => {
        stream.end((err?: Error | null) => {
            if (err) {
                reject(err)
                return
            }

            resolve()
        })
    })
}

export interface CliOptions {
    log_dir: string
    max_sessions: number
    combined: boolean
    excludes: string[]
    mutes: string[]
}

export const DEFAULT_CLI_OPTIONS: CliOptions = {
    log_dir: "tmp/logs",
    max_sessions: 10,
    combined: true,
    excludes: [],
    mutes: [],
}

export interface TailCommandOptions {
    log_dir: string
    query?: string
    tail_args: string[]
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

export function find_session_dir(
    project_root: string,
    log_dir = DEFAULT_CLI_OPTIONS.log_dir
): string | null {
    const manager = create_manager({
        ...DEFAULT_CLI_OPTIONS,
        log_dir,
    })
    return manager.find_session(project_root)
}

export interface ServiceConfig {
    name: string
    command: string
}

function forward_signals_to_children(
    children: Array<{ kill: (signal?: NodeJS.Signals | number) => boolean }>
): () => void {
    const signal_handlers = (["SIGINT", "SIGTERM"] as const).map((signal) => {
        const handler = () => {
            for (const child of children) {
                child.kill(signal)
            }
        }
        process.on(signal, handler)
        return [signal, handler] as const
    })

    return () => {
        for (const [signal, handler] of signal_handlers) {
            process.off(signal, handler)
        }
    }
}

export function resolve_tail_paths(
    project_root: string,
    options: TailCommandOptions
): string[] {
    const session_dir = find_session_dir(project_root, options.log_dir)
    const resolved_log_dir = path.resolve(project_root, options.log_dir)

    if (!session_dir) {
        throw new Error(
            `No log session found in ${resolved_log_dir}. Run "agent-tail run", "agent-tail wrap", or start a framework plugin first.`
        )
    }

    const log_files = fs
        .readdirSync(session_dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".log"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))

    if (log_files.length === 0) {
        throw new Error(`No .log files found in ${session_dir}.`)
    }

    if (!options.query) {
        return log_files.map((file_name) => path.join(session_dir, file_name))
    }

    const normalized_query = options.query.toLowerCase()
    const exact_names = new Set([
        normalized_query,
        normalized_query.endsWith(".log")
            ? normalized_query
            : `${normalized_query}.log`,
    ])

    const exact_matches = log_files.filter((file_name) =>
        exact_names.has(file_name.toLowerCase())
    )

    if (exact_matches.length > 0) {
        return exact_matches.map((file_name) => path.join(session_dir, file_name))
    }

    const partial_matches = log_files.filter((file_name) => {
        const normalized_name = file_name.toLowerCase()
        return (
            normalized_name.includes(normalized_query) ||
            path.basename(normalized_name, ".log").includes(normalized_query)
        )
    })

    if (partial_matches.length > 0) {
        return partial_matches.map((file_name) =>
            path.join(session_dir, file_name)
        )
    }

    throw new Error(
        `No logs found for "${options.query}" in ${session_dir}. Available logs: ${log_files.join(", ")}`
    )
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
 * Tail the latest session's logs by forwarding to the system tail command.
 */
export function cmd_tail(
    project_root: string,
    options: TailCommandOptions
): Promise<number> {
    const log_paths = resolve_tail_paths(project_root, options)
    const child = spawn("tail", [...options.tail_args, ...log_paths], {
        stdio: "inherit",
    })
    const cleanup_signal_handlers = forward_signals_to_children([child])

    return new Promise((resolve, reject) => {
        child.on("close", (code) => {
            cleanup_signal_handlers()
            resolve(code ?? 0)
        })

        child.on("error", (err: NodeJS.ErrnoException) => {
            cleanup_signal_handlers()
            if (err.code === "ENOENT") {
                reject(
                    new Error(
                        'System "tail" command not found. "agent-tail tail" requires a POSIX-style tail binary.'
                    )
                )
                return
            }
            reject(err)
        })
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
    const text = strip_ansi_codes(chunk.toString())
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
        env: get_child_env(session_dir),
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
    const cleanup_signal_handlers = forward_signals_to_children([child])

    return new Promise((resolve, reject) => {
        child.on("close", async (code) => {
            cleanup_signal_handlers()

            try {
                await Promise.all([
                    end_stream(log_stream),
                    end_stream(combined_stream),
                ])
                resolve(code ?? 0)
            } catch (err) {
                reject(err)
            }
        })

        child.on("error", async (err) => {
            cleanup_signal_handlers()

            try {
                await Promise.all([
                    end_stream(log_stream),
                    end_stream(combined_stream),
                ])
            } catch {
                // Ignore stream shutdown errors when surfacing child process error.
            }

            reject(err)
        })
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
        const is_muted = options.mutes.includes(svc.name)

        const child = spawn(svc.command, {
            stdio: ["inherit", "pipe", "pipe"],
            env: get_child_env(session_dir),
            shell: true,
        })

        function handle(target: NodeJS.WriteStream, chunk: Buffer) {
            const text = chunk.toString()
            const lines = text.split(/\r?\n/)
            for (let j = 0; j < lines.length; j++) {
                if (lines[j].length > 0) {
                    const log_line = strip_ansi_codes(lines[j])
                    if (options.excludes.length && should_exclude(log_line, options.excludes)) continue
                    log_stream.write(log_line + "\n")
                    if (!is_muted) {
                        target.write(`${tag} ${lines[j]}\n`)
                        combined_stream?.write(`[${svc.name}] ${log_line}\n`)
                    }
                } else if (j < lines.length - 1) {
                    log_stream.write("\n")
                    if (!is_muted) {
                        target.write("\n")
                        combined_stream?.write("\n")
                    }
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

    const cleanup_signal_handlers = forward_signals_to_children(children)

    return Promise.all(promises).then(async () => {
        cleanup_signal_handlers()

        await end_stream(combined_stream)
    }, (error) => {
        cleanup_signal_handlers()
        throw error
    })
}
