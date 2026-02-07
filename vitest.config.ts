import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
    resolve: {
        alias: {
            "agent-tail-core": path.resolve(__dirname, "packages/core/src"),
        },
    },
    test: {
        include: ["tests/**/*.test.ts"],
    },
})
