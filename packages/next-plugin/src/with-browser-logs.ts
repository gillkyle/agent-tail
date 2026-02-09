import type { BrowserLogsOptions } from "agent-tail-core"
import fs from "node:fs"
import { resolve_options, LogManager, SESSION_ENV_VAR } from "agent-tail-core"

interface NextConfig {
    env?: Record<string, string>
    webpack?: (config: any, context: any) => any
    [key: string]: any
}

export function withAgentTail(
    next_config: NextConfig = {},
    user_options?: BrowserLogsOptions
): NextConfig {
    const options = resolve_options(user_options)
    const log_manager = new LogManager(options)

    // Join an existing session from the CLI, or create a new one
    const parent_session = process.env[SESSION_ENV_VAR]
    let log_path: string
    if (parent_session && fs.existsSync(parent_session)) {
        log_path = log_manager.join_session(parent_session)
    } else {
        const project_root = process.cwd()
        log_path = log_manager.initialize(project_root)
    }

    return {
        ...next_config,
        env: {
            ...next_config.env,
            __BROWSER_LOGS_ENDPOINT: options.endpoint,
            __BROWSER_LOGS_PATH: log_path,
            __BROWSER_LOGS_EXCLUDES: JSON.stringify(options.excludes),
        },
        webpack(config: any, context: any) {
            if (typeof next_config.webpack === "function") {
                config = next_config.webpack(config, context)
            }
            return config
        },
    }
}
