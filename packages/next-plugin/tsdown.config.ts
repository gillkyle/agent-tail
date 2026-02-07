import { defineConfig } from "tsdown"

export default defineConfig({
    entry: ["src/index.ts", "src/handler.ts", "src/script.tsx"],
    format: ["esm"],
    dts: true,
    clean: true,
    external: ["next", "react", "react/jsx-runtime", "agent-tail-core"],
})
