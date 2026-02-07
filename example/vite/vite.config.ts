import { defineConfig } from "vite"
import { browser_logs } from "../../packages/vite-plugin/src"

export default defineConfig({
    plugins: [
        browser_logs({
            // All defaults shown — uncomment to customize:
            // logDir: "tmp/logs",
            // logFileName: "browser.log",
            // maxLogSessions: 10,
            // endpoint: "/__browser-logs",
            // flushInterval: 500,
            // maxBatchSize: 50,
            // maxSerializeLength: 2000,
            // warnOnMissingGitignore: true,
            // levels: ["log", "warn", "error", "info", "debug"],
            // captureErrors: true,
            // captureRejections: true,
        }),
    ],
})
