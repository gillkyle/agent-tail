"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeBlock } from "./components/CodeBlock";
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
						to log files your AI coding agents can read and <code>grep</code>.
					</p>
				</header>
			</article>

			<HeroDemo />

			<article className="article" style={{ paddingTop: "1rem" }}>
				<section>
					<h2>Try it</h2>
					<CodeBlock
						code={`npx agent-tail-core run 'server: echo "Hello world!"' && cat tmp/logs/latest/server.log`}
						language="bash"
						copyable
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						Run a command, output is captured to a log file, read the file.
						That&apos;s the full cycle.
					</p>
				</section>

				<section>
					<h2>Two ways to use agent-tail</h2>

					<h3>CLI &mdash; capture server output</h3>
					<p>
						<code>agent-tail run</code> wraps any command (or commands!) and
						pipes their stdout/stderr to log files. Works with any dev server,
						any language, zero config.
					</p>
					<CodeBlock
						code={`agent-tail run 'fe: npm run dev' 'api: uv run server'`}
						language="bash"
						copyable
					/>

					<h3>Framework plugins &mdash; capture browser console output</h3>
					<p>
						The Vite and Next.js plugins inject a small script that intercepts{" "}
						<code>console.log</code>, <code>console.warn</code>,{" "}
						<code>console.error</code>, unhandled errors, and unhandled promise
						rejections. Logs are sent to the dev server and written to{" "}
						<code>browser.log</code>.
					</p>

					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						They&apos;re complementary: use both to get server + browser logs in
						one place.
					</p>
				</section>

				<section>
					<h2>Quick start (Vite)</h2>
					<CodeBlock
						code={`npm install -D agent-tail`}
						language="bash"
						copyable
					/>
					<CodeBlock
						code={`// vite.config.ts
import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [agentTail()],
})`}
						language="typescript"
					/>
					<p>Then in another terminal:</p>
					<CodeBlock
						code="tail -f tmp/logs/latest/browser.log"
						language="bash"
						copyable
					/>
					<p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
						Or skip the plugin entirely and use the CLI:{" "}
						<code>agent-tail run &apos;fe: npm run dev&apos;</code>
					</p>
				</section>

				<section>
					<h2>What gets captured</h2>
					<ul>
						<li>
							<strong>CLI:</strong> stdout and stderr from any command
						</li>
						<li>
							<strong>Plugins:</strong> <code>console.log</code>,{" "}
							<code>console.warn</code>, <code>console.error</code>,{" "}
							<code>console.info</code>, <code>console.debug</code>
						</li>
						<li>
							<strong>Unhandled errors</strong> (<code>window.onerror</code>)
							&mdash; logged as <code>UNCAUGHT_ERROR</code>
						</li>
						<li>
							<strong>Unhandled promise rejections</strong> &mdash; logged as{" "}
							<code>UNHANDLED_REJECTION</code>
						</li>
					</ul>
				</section>

				<section>
					<h2>Why files, not MCP</h2>
					<p>
						Plain log files beat a protocol server for this use case. They work
						with any agent, any editor, <code>tail</code>, <code>grep</code>,{" "}
						<code>awk</code>. No connection state, no tool registration, no
						token overhead. Agents already know how to read files.
					</p>
					<p>
						<Link href="/faq" className="styled-link">
							Read more in the FAQ <span className="arrow">&rarr;</span>
						</Link>
					</p>
				</section>

				<section className="quickstart-links">
					<p>
						<Link href="/install" className="styled-link">
							Installation guides for Vite, Next.js, and CLI{" "}
							<span className="arrow">&rarr;</span>
						</Link>
					</p>
					<p>
						<Link href="/features" className="styled-link">
							Session management, multi-server aggregation, and more{" "}
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
