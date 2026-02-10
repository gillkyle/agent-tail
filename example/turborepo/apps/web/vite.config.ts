import { defineConfig } from "vite"
import { agentTail } from "../../../../packages/vite-plugin/src"

export default defineConfig({
    plugins: [
        agentTail({
            logDir: "../../tmp/logs",
        }),
    ],
})
