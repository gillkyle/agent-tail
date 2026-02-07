export interface BrowserLogsOptions {
    /** Directory for log storage, relative to project root. Default: "tmp/logs" */
    logDir?: string
    /** Log file name within each session directory. Default: "browser.log" */
    logFileName?: string
    /** Maximum number of log session directories to retain. Default: 10 */
    maxLogSessions?: number
    /** Server endpoint path for receiving log batches. Default: "/__browser-logs" */
    endpoint?: string
    /** Client-side flush interval in milliseconds. Default: 500 */
    flushInterval?: number
    /** Client-side max batch size before immediate flush. Default: 50 */
    maxBatchSize?: number
    /** Max character length for serialized objects in client. Default: 2000 */
    maxSerializeLength?: number
    /** Warn in terminal if logDir is not in .gitignore. Default: true */
    warnOnMissingGitignore?: boolean
    /** Console methods to intercept. Default: ["log", "warn", "error", "info", "debug"] */
    levels?: string[]
    /** Capture window unhandled errors. Default: true */
    captureErrors?: boolean
    /** Capture unhandled promise rejections. Default: true */
    captureRejections?: boolean
    /** Patterns to exclude from logs. Strings are substring matches, patterns starting with "/" are regex. Default: [] */
    excludes?: string[]
}

export interface LogEntry {
    level: string
    args: string[]
    timestamp: string
    url?: string
    stack?: string
}

export type ResolvedOptions = Required<BrowserLogsOptions>

export const DEFAULT_OPTIONS: ResolvedOptions = {
    logDir: "tmp/logs",
    logFileName: "browser.log",
    maxLogSessions: 10,
    endpoint: "/__browser-logs",
    flushInterval: 500,
    maxBatchSize: 50,
    maxSerializeLength: 2000,
    warnOnMissingGitignore: true,
    levels: ["log", "warn", "error", "info", "debug"],
    captureErrors: true,
    captureRejections: true,
    excludes: [],
}

export function resolve_options(user_options?: BrowserLogsOptions): ResolvedOptions {
    return { ...DEFAULT_OPTIONS, ...user_options }
}
