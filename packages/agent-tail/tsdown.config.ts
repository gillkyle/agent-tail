import { defineConfig } from "tsdown"

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/vite.ts",
        "src/next.ts",
        "src/handler.ts",
        "src/script.tsx",
    ],
    format: ["esm"],
    dts: true,
    clean: true,
    external: [
        "vite",
        "next",
        "react",
        "react/jsx-runtime",
        "agent-tail-core",
        "vite-plugin-agent-tail",
        "next-plugin-agent-tail",
        "next-plugin-agent-tail/handler",
        "next-plugin-agent-tail/script",
    ],
})
