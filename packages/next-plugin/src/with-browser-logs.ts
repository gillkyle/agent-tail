import type { BrowserLogsOptions } from "agent-tail-core"
import { resolve_options, LogManager } from "agent-tail-core"

interface NextConfig {
    env?: Record<string, string>
    webpack?: (config: any, context: any) => any
    [key: string]: any
}

export function with_browser_logs(
    next_config: NextConfig = {},
    user_options?: BrowserLogsOptions
): NextConfig {
    const options = resolve_options(user_options)
    const log_manager = new LogManager(options)

    // Initialize log directory at config time (runs when dev server starts)
    const project_root = process.cwd()
    const log_path = log_manager.initialize(project_root)

    return {
        ...next_config,
        env: {
            ...next_config.env,
            __BROWSER_LOGS_ENDPOINT: options.endpoint,
            __BROWSER_LOGS_PATH: log_path,
        },
        webpack(config: any, context: any) {
            if (typeof next_config.webpack === "function") {
                config = next_config.webpack(config, context)
            }
            return config
        },
    }
}
