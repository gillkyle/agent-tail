"use client";

import { useState } from "react";
import { Footer } from "../Footer";

interface FAQItem {
	question: string;
	answer: string;
}

interface FAQCategory {
	title: string;
	items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
	{
		title: "Basics",
		items: [
			{
				question: "What does &>> mean?",
				answer:
					"In bash, <code>&gt;&gt;</code> appends stdout to a file and <code>&amp;&gt;&gt;</code> appends <em>both</em> stdout and stderr to a file. That's exactly what agent-tail does — captures all output (stdout, stderr, browser console, unhandled errors) and appends it to log files on disk. We use <code>&amp;&gt;&gt;</code> as the project's symbol.",
			},
			{
				question: "What is agent-tail?",
				answer:
					"agent-tail pipes browser console output to log files on disk during development. You can then <code>tail -f</code> them in your terminal alongside your backend server logs. It's designed for AI coding agents that already know how to read files and use <code>grep</code>.",
			},
			{
				question: "Which frameworks are supported?",
				answer:
					"There are dedicated plugins for <strong>Vite</strong> (<code>vite-plugin-agent-tail</code>) and <strong>Next.js</strong> (<code>next-plugin-agent-tail</code>). The CLI (<code>agent-tail-core</code>) works with any dev server command.",
			},
			{
				question: "What console methods are captured?",
				answer:
					"By default: <code>console.log</code>, <code>console.warn</code>, <code>console.error</code>, <code>console.info</code>, and <code>console.debug</code>. You can customize this with the <code>levels</code> option. Additionally, unhandled errors (<code>window.onerror</code>) and unhandled promise rejections are captured by default.",
			},
			{
				question: "How do I use this with non-JS backends?",
				answer:
					"Use <code>agent-tail run</code> or <code>agent-tail wrap</code> to capture stdout/stderr from any command. Or point your server's logging directly at <code>tmp/logs/latest/</code>. The README has examples for Python, Node.js, Ruby, and Go.",
			},
		],
	},
	{
		title: "Architecture",
		items: [
			{
				question: "Why files instead of MCP?",
				answer:
					'Plain log files beat a protocol server for this use case:<br/><br/><strong>Universal</strong> — works with any agent, any editor, <code>tail</code>, <code>grep</code>, <code>awk</code>. MCP only works with agents that explicitly support it.<br/><br/><strong>No moving parts</strong> — <code>appendFile()</code> vs. a server process + protocol + tool registration + connection lifecycle.<br/><br/><strong>Zero connection state</strong> — the file is a persistent timeline, not a live stream you can miss.<br/><br/><strong>Composable</strong> — pipe through <code>grep</code>, chain with <code>awk</code>, redirect to another file. MCP tool results have to pass through the agent\'s context window.<br/><br/><strong>Token efficient</strong> — reading a file costs nothing in tool descriptions. MCP servers use 13–18k tokens just in tool definitions.<br/><br/><strong>Deterministic for agents</strong> — "read the last 200 lines of <code>tmp/logs/latest/browser.log</code>" beats hoping the model calls a tool correctly.<br/><br/>That said, MCP has real strengths in other contexts — structured, queryable interfaces for complex data sources, or environments where the agent has no filesystem access.',
			},
			{
				question: "Does this work in production?",
				answer:
					"No, and it's not designed to. agent-tail is a development tool. The injected client script only activates in development mode. For production logging, use a proper observability stack.",
			},
			{
				question: "How does session management work?",
				answer:
					"Each dev server start creates a new timestamped directory (e.g. <code>2024-01-15T10-30-00-123Z/</code>) under your log directory. A <code>latest</code> symlink is updated to point to the newest session. Old sessions beyond <code>maxLogSessions</code> are automatically pruned.",
			},
			{
				question: "Can multiple servers write to the same session?",
				answer:
					"Yes! This is a core feature. Use <code>agent-tail run</code> to start everything from one command, or use <code>agent-tail wrap</code> to add services to an existing session. Each service gets its own log file, plus a <code>combined.log</code> with everything interleaved.",
			},
		],
	},
	{
		title: "Troubleshooting",
		items: [
			{
				question: "I don't see any logs appearing",
				answer:
					"Make sure your dev server is running and you're visiting a page in the browser. Check that the plugin is correctly configured in your build config. Look for the <code>/__browser-logs</code> endpoint being registered in your dev server output.",
			},
			{
				question: "The gitignore warning is annoying",
				answer:
					"Either add <code>tmp/</code> to your <code>.gitignore</code> (recommended) or set <code>warnOnMissingGitignore: false</code> in the plugin options.",
			},
			{
				question: "How do I report bugs?",
				answer:
					'Open an issue on <a href="https://github.com/gillkyle/agent-tail/issues" target="_blank" rel="noopener noreferrer" class="faq-link">GitHub</a>.',
			},
		],
	},
];

function FAQToggle({
	item,
	isOpen,
	onToggle,
}: {
	item: FAQItem;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="faq-item">
			<button
				className="faq-question"
				onClick={onToggle}
				aria-expanded={isOpen}
			>
				<span>{item.question}</span>
				<span className={`faq-icon ${isOpen ? "open" : ""}`}>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path
							d="M2.5 4.5L6 8L9.5 4.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			</button>
			<div className={`faq-answer ${isOpen ? "open" : ""}`}>
				<div className="faq-answer-inner">
					<p dangerouslySetInnerHTML={{ __html: item.answer }} />
				</div>
			</div>
		</div>
	);
}

export default function FAQPage() {
	const [openKey, setOpenKey] = useState<string | null>(null);

	const handleToggle = (key: string) => {
		setOpenKey(openKey === key ? null : key);
	};

	return (
		<>
			<style>{`
        .faq-category {
          margin-top: 0.5rem;
        }
        .faq-category + .faq-category {
          margin-top: 1.5rem;
        }
        .faq-category h2 {
          margin-bottom: 0.25rem;
        }
        .faq-item {
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .faq-item:last-child {
          border-bottom: none;
        }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.625rem 0;
          font-size: 0.75rem;
          font-weight: 450;
          color: rgba(0, 0, 0, 0.55);
          text-align: left;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .faq-question:hover {
          color: rgba(0, 0, 0, 0.8);
        }
        .faq-icon {
          flex-shrink: 0;
          color: rgba(0, 0, 0, 0.3);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease;
        }
        .faq-icon.open {
          transform: rotate(180deg);
          color: rgba(0, 0, 0, 0.5);
        }
        .faq-answer {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .faq-answer.open {
          grid-template-rows: 1fr;
        }
        .faq-answer-inner {
          overflow: hidden;
        }
        .faq-answer-inner p {
          padding-bottom: 1rem;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.55);
        }
        .faq-answer-inner p + p {
          padding-top: 0;
          margin-top: -0.5rem;
        }
        .faq-answer-inner code {
          font-family: "SF Mono", "SFMono-Regular", ui-monospace, Consolas, monospace;
          font-size: 0.75rem;
          background: rgba(0, 0, 0, 0.04);
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
          color: rgba(0, 0, 0, 0.65);
        }
        .faq-link {
          color: #2480ed;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .faq-link:hover {
          color: #74b1fd;
        }
      `}</style>
			<article className="article">
				<header>
					<h1>FAQ</h1>
					<p className="tagline">Common questions about agent-tail</p>
				</header>

				{faqCategories.map((category, catIndex) => (
					<div key={catIndex} className="faq-category">
						<h2>{category.title}</h2>
						{category.items.map((faq, itemIndex) => {
							const key = `${catIndex}-${itemIndex}`;
							return (
								<FAQToggle
									key={key}
									item={faq}
									isOpen={openKey === key}
									onToggle={() => handleToggle(key)}
								/>
							);
						})}
					</div>
				))}
			</article>

			<Footer />
		</>
	);
}
