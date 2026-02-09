"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeBlock } from "./components/CodeBlock";
import { DiffBlock } from "./components/DiffBlock";
import { HeroDemo } from "./components/HeroDemo";
import { Footer } from "./Footer";

const IconCopyAnimated = ({
	size = 24,
	copied = false,
}: {
	size?: number;
	copied?: boolean;
}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
		<style>{`
      .copy-icon, .check-icon {
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
    `}</style>
		<g
			className="copy-icon"
			style={{
				opacity: copied ? 0 : 1,
				transform: copied ? "scale(0.8)" : "scale(1)",
				transformOrigin: "center",
			}}
		>
			<path
				d="M4.75 11.25C4.75 10.4216 5.42157 9.75 6.25 9.75H12.75C13.5784 9.75 14.25 10.4216 14.25 11.25V17.75C14.25 18.5784 13.5784 19.25 12.75 19.25H6.25C5.42157 19.25 4.75 18.5784 4.75 17.75V11.25Z"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M17.25 14.25H17.75C18.5784 14.25 19.25 13.5784 19.25 12.75V6.25C19.25 5.42157 18.5784 4.75 17.75 4.75H11.25C10.4216 4.75 9.75 5.42157 9.75 6.25V6.75"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</g>
		<g
			className="check-icon"
			style={{
				opacity: copied ? 1 : 0,
				transform: copied ? "scale(1)" : "scale(0.8)",
				transformOrigin: "center",
			}}
		>
			<path
				d="M12 20C7.58172 20 4 16.4182 4 12C4 7.58172 7.58172 4 12 4C16.4182 4 20 7.58172 20 12C20 16.4182 16.4182 20 12 20Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M15 10L11 14.25L9.25 12.25"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
	</svg>
);

function InstallSnippet() {
	const [copied, setCopied] = useState(false);
	const command = "npm install agent-tail";

	const handleCopy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			onClick={handleCopy}
			className="install-snippet"
			title="Copy to clipboard"
		>
			<code>{command}</code>
			<IconCopyAnimated size={14} copied={copied} />
		</button>
	);
}

export default function OverviewPage() {
	return (
		<>
			<article className="article" style={{ paddingBottom: 0, gap: "0.5rem" }}>
				<header style={{ position: "relative" }}>
					<h1
						style={{
							fontSize: "2rem",
							lineHeight: 1.15,
							marginBottom: "0.5rem",
						}}
					>
						Development logs made agent accessible.
					</h1>
					<InstallSnippet />
					<p className="tagline">
						<code>agent-tail</code> pipes server output and browser console logs
						to a single consistent location your AI coding agents can easily
						read and <code>grep</code>.
					</p>
				</header>
			</article>

			<HeroDemo />

			<article className="article" style={{ paddingTop: "1rem" }}>
				<section>
					<h2>How you use it</h2>

					<h3>Wrap your dev command</h3>
					<p>
						The simplest path &mdash; add one line to your{" "}
						<code>package.json</code>:
					</p>
					<DiffBlock
						oldFile={{
							name: "package.json",
							contents: `{
    "scripts": {
        "dev": "npm run dev && uv run server"
    }
}`,
						}}
						newFile={{
							name: "package.json",
							contents: `{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server'"
    }
}
`,
						}}
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						One line, zero config. Every service gets its own log file plus a{" "}
						<code>combined.log</code>.
					</p>

					<h3>Add a framework plugin</h3>
					<p>For browser console capture, add the Vite or Next.js plugin:</p>
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
})`,
						}}
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						They&apos;re complementary &mdash; use the CLI for server output and
						a plugin for browser console.{" "}
						<Link href="/install" className="styled-link">
							Next.js + full setup <span className="arrow">&rarr;</span>
						</Link>
					</p>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						<Link href="/playground" className="styled-link">
							try the playground <span className="arrow">&rarr;</span>
						</Link>
					</p>
				</section>

				<section>
					<h2>How agents use it</h2>
					<p>
						agent-tail works best with AI tools that have access to your
						codebase &mdash; Claude Code, Cursor, Amp, and others. When your
						agent reads the log files, it gets:
					</p>
					<ul>
						<li>Timestamped errors with source locations</li>
						<li>Stack traces to trace the call path</li>
						<li>Server and browser output side by side</li>
						<li>
							The exact error message &mdash; no paraphrasing, no guessing
						</li>
					</ul>

					<h3>Without agent-tail</h3>
					<p>
						You copy-paste from browser devtools, describe the error in prose
						(&ldquo;there&apos;s a 500 on the users page&rdquo;), and hope the
						agent guesses right. Or you install an MCP browser tool that
						requires a running connection, can&apos;t be piped through{" "}
						<code>grep</code>, and gives you structured results you can&apos;t
						compose with other tools.
					</p>

					<h3>With agent-tail</h3>
					<p>
						Every time you start your dev server, agent-tail creates a new
						session directory and symlinks <code>tmp/logs/latest/</code> to it.
						The agent runs <code>grep ERROR tmp/logs/latest/</code> and gets the
						exact stack trace, source file, and line number. Plain files &mdash;
						no connection state, no tool registration, no token overhead. Agents
						already know how to read files.
					</p>
				</section>

				<section id="try-it">
					<h2>Try it</h2>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						Run a dummy command to see how simple the output capture really is.{" "}
						<Link href="/playground" className="styled-link">
							Or try the interactive playground{" "}
							<span className="arrow">&rarr;</span>
						</Link>
					</p>
					<CodeBlock
						code={`npx agent-tail run 'server: echo "Hello world!"' && cat tmp/logs/latest/server.log`}
						language="bash"
						copyable
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						You run any command, output is captured to a log file, you or an
						agent can read the file. That&apos;s the full cycle.{" "}
					</p>
				</section>

				<section className="quickstart-links">
					<p>
						<Link href="/playground" className="styled-link">
							Interactive playground <span className="arrow">&rarr;</span>
						</Link>
					</p>
					<p>
						<Link href="/install" className="styled-link">
							Installation guides for Vite, Next.js, and CLI{" "}
							<span className="arrow">&rarr;</span>
						</Link>
					</p>
					<p>
						<Link href="/features" className="styled-link">
							Log filtering, multi-server aggregation, and more features{" "}
							<span className="arrow">&rarr;</span>
						</Link>
					</p>
					<p>
						<Link href="/api-reference" className="styled-link">
							Full configuration options and types{" "}
							<span className="arrow">&rarr;</span>
						</Link>
					</p>
				</section>
			</article>

			<Footer />
		</>
	);
}
