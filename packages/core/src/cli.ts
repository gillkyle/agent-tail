#!/usr/bin/env node

import { parseArgs } from "node:util"
import { cmd_init, cmd_wrap, cmd_run } from "./commands"
import type { CliOptions } from "./commands"

const HELP = `
  \x1b[1magent-tail\x1b[0m — Pipe any dev server's output into your unified log session

  \x1b[1mUsage:\x1b[0m
    agent-tail init                          Create a new log session
    agent-tail wrap <name> -- <command...>   Wrap a command, pipe output to <name>.log
    agent-tail run <config...>               Run multiple services concurrently

  \x1b[1mOptions:\x1b[0m
    --log-dir <dir>       Log directory relative to cwd (default: tmp/logs)
    --max-sessions <n>    Max sessions to keep (default: 10)
    --no-combined         Don't write to combined.log
    --exclude <pattern>   Exclude lines matching pattern (repeatable, /regex or substring)
    --mute <name>         Mute a service from terminal and combined.log (repeatable, still logs to <name>.log)
    -h, --help            Show this help

  \x1b[1mExamples:\x1b[0m
    agent-tail init
    agent-tail wrap api -- uv run fastapi-server
    agent-tail wrap worker -- python -m celery worker
    agent-tail run "fe: npm run dev" "api: uv run server" "worker: uv run worker"
`

function parse_cli_options(args: string[]): {
    options: CliOptions
    positionals: string[]
    rest: string[]
} {
    const dash_index = args.indexOf("--")
    const before_dash = dash_index >= 0 ? args.slice(0, dash_index) : args
    const rest = dash_index >= 0 ? args.slice(dash_index + 1) : []

    const { values, positionals } = parseArgs({
        args: before_dash,
        options: {
            "log-dir": { type: "string", default: "tmp/logs" },
            "max-sessions": { type: "string", default: "10" },
            "no-combined": { type: "boolean", default: false },
            exclude: { type: "string", multiple: true },
            mute: { type: "string", multiple: true },
            help: { type: "boolean", short: "h", default: false },
        },
        allowPositionals: true,
        strict: false,
    })

    if (values.help) {
        console.log(HELP)
        process.exit(0)
    }

    return {
        options: {
            log_dir: (values["log-dir"] as string) ?? "tmp/logs",
            max_sessions: parseInt(
                (values["max-sessions"] as string) ?? "10",
                10
            ),
            combined: !(values["no-combined"] as boolean),
            excludes: (values.exclude as string[] | undefined) ?? [],
            mutes: (values.mute as string[] | undefined) ?? [],
        },
        positionals,
        rest,
    }
}

async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
        console.log(HELP)
        process.exit(0)
    }

    const subcommand = args[0]
    const sub_args = args.slice(1)
    const { options, positionals, rest } = parse_cli_options(sub_args)
    const project_root = process.cwd()

    try {
        switch (subcommand) {
            case "init": {
                const session_dir = cmd_init(project_root, options)
                console.log(session_dir)
                break
            }
            case "wrap": {
                const code = await cmd_wrap(
                    project_root,
                    positionals[0],
                    rest,
                    options
                )
                process.exit(code)
                break
            }
            case "run": {
                await cmd_run(project_root, positionals, options)
                process.exit(0)
                break
            }
            default:
                console.error(
                    `\x1b[36m[agent-tail]\x1b[0m Unknown command: ${subcommand}`
                )
                console.log(HELP)
                process.exit(1)
        }
    } catch (err: any) {
        console.error(`\x1b[36m[agent-tail]\x1b[0m Error: ${err.message}`)
        process.exit(1)
    }
}

main()
