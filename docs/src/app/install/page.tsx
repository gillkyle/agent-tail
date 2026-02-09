"use client";

import { CodeBlock } from "../components/CodeBlock";
import { DiffBlock } from "../components/DiffBlock";
import { Footer } from "../Footer";

export default function InstallPage() {
	return (
		<>
			<article className="article">
				<header>
					<h1>Installation</h1>
					<p className="tagline">Get started with agent-tail in your project</p>
				</header>

				<section>
					<p>
						agent-tail captures two kinds of logs: <strong>server-side</strong>{" "}
						output (stdout/stderr from your dev commands) and{" "}
						<strong>client-side</strong> output (browser <code>console.*</code>{" "}
						calls). The CLI handles server logs and works with any stack.
						Framework plugins for Vite and Next.js handle browser logs. Use them
						together to get everything in one place.
					</p>
				</section>

				<section>
					<h2 id="cli">CLI (server-side logs)</h2>
					<p>
						The CLI wraps any command and captures its stdout/stderr to log
						files. No plugins, no config &mdash; works with any language or
						framework.
					</p>
					<CodeBlock
						code="npm install -D agent-tail"
						language="bash"
						copyable
					/>
					<h3>
						<code>agent-tail run</code>
					</h3>
					<p>Wrap one or more commands with unified logging:</p>
					<DiffBlock
						oldFile={{
							name: "package.json",
							contents: `{
    "scripts": {
        "dev": "next dev",
        "api": "uv run server",
        "worker": "uv run worker"
    }
}
`,
						}}
						newFile={{
							name: "package.json",
							contents: `{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'"
    }
}
`,
						}}
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						Creates a session directory, spawns all services, prefixes output
						with <code>[name]</code>, and writes individual + combined log
						files.
					</p>
					<p>
						It works with any command, not just Node &mdash; Python, Go, Ruby,
						whatever you run in a terminal:
					</p>
					<CodeBlock
						code="npx agent-tail run 'api: uv run fastapi dev'"
						language="bash"
						copyable
					/>
				</section>

				<section>
					<h2 id="vite">Vite plugin (browser logs)</h2>
					<p>
						The Vite plugin captures browser <code>console.*</code> calls by
						injecting a small script into your page during development. Logs are
						written to <code>browser.log</code> in the same session directory
						the CLI uses.
					</p>
					<CodeBlock
						code="npm install -D agent-tail"
						language="bash"
						copyable
					/>
					<DiffBlock
						oldFile={{
							name: "vite.config.ts",
							contents: `import { defineConfig } from "vite"

export default defineConfig({
    plugins: [],
})
`,
						}}
						newFile={{
							name: "vite.config.ts",
							contents: `import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [agentTail()],
})
`,
						}}
					/>
					<p>Then in another terminal:</p>
					<CodeBlock
						code="tail -f tmp/logs/latest/browser.log"
						language="bash"
						copyable
					/>
				</section>

				<section>
					<h2 id="nextjs">Next.js plugin (browser logs)</h2>
					<p>
						The Next.js plugin does the same thing &mdash; captures browser{" "}
						<code>console.*</code> output &mdash; but requires a bit more wiring
						because of how Next.js handles config, layouts, and API routes.
					</p>
					<CodeBlock
						code="npm install -D agent-tail"
						language="bash"
						copyable
					/>
					<h3>1. Wrap your Next.js config</h3>
					<DiffBlock
						oldFile={{
							name: "next.config.ts",
							contents: `const nextConfig = {
    // your Next.js config
}

export default nextConfig`,
						}}
						newFile={{
							name: "next.config.ts",
							contents: `import { withAgentTail } from "agent-tail/next"

export default withAgentTail({
    // your Next.js config
})`,
						}}
					/>
					<h3>2. Add the script to your layout</h3>
					<DiffBlock
						oldFile={{
							name: "app/layout.tsx",
							contents: `export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head />
            <body>{children}</body>
        </html>
    )
}`,
						}}
						newFile={{
							name: "app/layout.tsx",
							contents: `import { AgentTailScript } from "agent-tail/next/script"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                {process.env.NODE_ENV === "development" && <AgentTailScript />}
            </head>
            <body>{children}</body>
        </html>
    )
}`,
						}}
					/>
					<h3>3. Create the API route</h3>
					<CodeBlock
						code={`// app/api/__browser-logs/route.ts
export { POST } from "agent-tail/next/handler"`}
						language="typescript"
					/>
				</section>

				<section>
					<h2 id="gitignore">.gitignore setup</h2>
					<p>
						Add your log directory to <code>.gitignore</code>:
					</p>
					<CodeBlock code={`# .gitignore\ntmp/`} language="bash" />
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						agent-tail warns on startup if the log directory isn&apos;t
						gitignored. Disable with <code>warnOnMissingGitignore: false</code>.
					</p>
				</section>

				<section>
					<h2 id="agent-setup">Agent setup</h2>
					<p>
						Install the agent-tail skill to give your AI coding agent built-in
						knowledge of how to set up and use agent-tail:
					</p>
					<CodeBlock
						code="npx skills add gillkyle/agent-tail"
						language="bash"
						copyable
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						The skill activates automatically when you ask about capturing logs,
						debugging runtime errors, or checking console output. Works with
						Claude Code, Cursor, Codex, and{" "}
						<a href="https://skills.sh" target="_blank" rel="noopener noreferrer">
							other supported agents
						</a>.
					</p>
					<p>
						Or add a snippet to your project&apos;s agent instructions file
						manually (<code>CLAUDE.md</code>, <code>.cursorrules</code>,{" "}
						<code>.github/copilot-instructions.md</code>, or equivalent):
					</p>
					<CodeBlock
						code={`## Dev Logs

All dev server output is captured to \`tmp/logs/\`. The latest session
is symlinked at \`tmp/logs/latest/\`.

When debugging, check logs before guessing about runtime behavior:

    grep -ri "error\\|warn" tmp/logs/latest/
    tail -50 tmp/logs/latest/browser.log`}
						language="markdown"
					/>
				</section>
			</article>

			<Footer />
		</>
	);
}
