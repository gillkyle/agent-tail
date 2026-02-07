"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const BROWSER_LOGS = [
	{ id: "b1", level: "log", message: "Loading user data..." },
	{ id: "b2", level: "warn", message: "Deprecated: use /v2/users" },
	{
		id: "b3",
		level: "error",
		message: "GET /api/users 500: Internal Server Error",
	},
	{ id: "b4", level: "log", message: "Retrying with fallback..." },
] as const;

const TERMINAL_LINES = [
	{
		id: "t1",
		text: "INFO:     Uvicorn running on http://127.0.0.1:8000",
		is_error: false,
	},
	{ id: "t2", text: "INFO:     GET /api/users", is_error: false },
	{
		id: "t3",
		text: "ERROR:    sqlalchemy.exc.OperationalError: could not connect to server",
		is_error: true,
	},
] as const;

const LOG_ENTRIES = [
	{
		id: "l1",
		time: "14:23:01.442",
		level: "LOG",
		source: "fe",
		message: "Loading user data...",
	},
	{
		id: "l2",
		time: "14:23:01.500",
		level: "INFO",
		source: "api",
		message: "GET /api/users",
	},
	{
		id: "l3",
		time: "14:23:01.501",
		level: "ERROR",
		source: "api",
		message: "OperationalError: could not connect to server",
	},
	{
		id: "l4",
		time: "14:23:01.520",
		level: "WARN",
		source: "fe",
		message: "Deprecated: use /v2/users",
	},
	{
		id: "l5",
		time: "14:23:01.521",
		level: "ERROR",
		source: "fe",
		message: "GET /api/users 500: Internal Server Error",
	},
	{
		id: "l6",
		time: "14:23:01.890",
		level: "LOG",
		source: "fe",
		message: "Retrying with fallback...",
	},
] as const;

const USER_MESSAGE =
	"There's a bug on the /users page. Can you check the browser logs?";

const ASSISTANT_MESSAGE = `● Read(tmp/logs/latest/fe.log)

Found the error:
  [14:23:01.521] [fe] [ERROR] GET /api/users 500: Internal Server Error

The API is returning 500s. Checking the server:
● Read(tmp/logs/latest/api.log)

  [14:23:01.501] [api] [ERROR] OperationalError: could not connect to server

Your database isn't running. Start postgres and the API will recover.`;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function HeroDemo() {
	const [browser_logs, set_browser_logs] = useState<
		(typeof BROWSER_LOGS)[number][]
	>([]);
	const [terminal_lines, set_terminal_lines] = useState<
		(typeof TERMINAL_LINES)[number][]
	>([]);
	const [log_entries, set_log_entries] = useState<
		(typeof LOG_ENTRIES)[number][]
	>([]);
	const [claude_messages, set_claude_messages] = useState<
		{ role: string; text: string }[]
	>([]);
	const [typed_text, set_typed_text] = useState("");
	const [typing_role, set_typing_role] = useState<"user" | "assistant" | null>(
		null,
	);
	const [active_tab, set_active_tab] = useState("combined.log");
	const [connector_active, set_connector_active] = useState(false);

	const cancelled_ref = useRef(false);
	const claude_body_ref = useRef<HTMLDivElement>(null);

	const run_animation = useCallback(async () => {
		while (!cancelled_ref.current) {
			// Reset state
			set_browser_logs([]);
			set_terminal_lines([]);
			set_log_entries([]);
			set_claude_messages([]);
			set_typed_text("");
			set_typing_role(null);
			set_active_tab("combined.log");
			set_connector_active(false);

			await delay(300);
			if (cancelled_ref.current) return;

			// Phase 1: Browser + terminal fill with logical timing
			// Each step: [browser_count, terminal_count]
			const steps: [number, number][] = [
				[1, 1], // "Loading user data..." + "Uvicorn running"
				[2, 2], // deprecation warning + server receives request
				[3, 3], // browser 500 + server OperationalError — together
				[4, 3], // browser retries
			];
			for (const [b, t] of steps) {
				if (cancelled_ref.current) return;
				set_browser_logs(BROWSER_LOGS.slice(0, b));
				set_terminal_lines(TERMINAL_LINES.slice(0, t));
				await delay(600);
			}

			if (cancelled_ref.current) return;
			set_connector_active(true);
			await delay(500);

			// Phase 2: Log entries appear (4-6.5s)
			for (let i = 0; i < LOG_ENTRIES.length; i++) {
				if (cancelled_ref.current) return;
				set_log_entries(LOG_ENTRIES.slice(0, i + 1));
				await delay(120);
			}

			set_connector_active(false);
			if (cancelled_ref.current) return;
			await delay(500);

			// Phase 3: Claude Code conversation (7-13s)
			// Type user message
			set_typing_role("user");
			for (let i = 0; i <= USER_MESSAGE.length; i++) {
				if (cancelled_ref.current) return;
				set_typed_text(USER_MESSAGE.slice(0, i));
				await delay(18);
			}

			// Commit user message
			set_typing_role(null);
			set_typed_text("");
			set_claude_messages([{ role: "user", text: USER_MESSAGE }]);

			await delay(300);
			if (cancelled_ref.current) return;

			// Type assistant message
			set_typing_role("assistant");
			for (let i = 0; i <= ASSISTANT_MESSAGE.length; i++) {
				if (cancelled_ref.current) return;
				set_typed_text(ASSISTANT_MESSAGE.slice(0, i));
				await delay(8);
			}

			// Commit assistant message
			set_typing_role(null);
			set_typed_text("");
			set_claude_messages([
				{ role: "user", text: USER_MESSAGE },
				{ role: "assistant", text: ASSISTANT_MESSAGE },
			]);

			if (cancelled_ref.current) return;

			// Phase 4: Hold for 4 seconds then loop
			await delay(4000);
		}
	}, []);

	useEffect(() => {
		cancelled_ref.current = false;
		run_animation();
		return () => {
			cancelled_ref.current = true;
		};
	}, [run_animation]);

	useEffect(() => {
		const el = claude_body_ref.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [typed_text, claude_messages]);

	return (
		<div className="hero-demo">
			{/* Source panels */}
			<div className="hero-demo-sources">
				{/* Browser: 2/3 width */}
				<div className="hero-demo-browser">
					<div className="window-chrome">
						<div className="window-dots">
							<span className="dot red" />
							<span className="dot yellow" />
							<span className="dot green" />
						</div>
						<div className="window-url">localhost:5173</div>
					</div>
					<div className="browser-page">
						{/* Simple page mockup - a few gray placeholder lines */}
						<div className="mock-line" style={{ width: "45%" }} />
						<div className="mock-line" style={{ width: "70%" }} />
						<div className="mock-line" style={{ width: "55%" }} />
					</div>
					<div className="browser-console">
						<div className="console-header">Console</div>
						<div className="console-body">
							<AnimatePresence>
								{browser_logs.map((log) => (
									<motion.div
										key={log.id}
										className={`console-line level-${log.level}`}
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.15 }}
									>
										<span className="console-level">{log.level}</span>
										<span className="console-msg">{log.message}</span>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					</div>
				</div>

				{/* Terminal: 1/3 width */}
				<div className="hero-demo-terminal">
					<div className="window-chrome dark">
						<div className="window-dots">
							<span className="dot red" />
							<span className="dot yellow" />
							<span className="dot green" />
						</div>
						<div className="window-terminal-title">Terminal</div>
						<div />
					</div>
					<div className="terminal-body">
						<div className="terminal-prompt">
							<span className="prompt-char">$</span> npx agent-tail run
							&apos;fe: vite dev&apos; &apos;api: uvicorn main:app&apos;
						</div>
						<AnimatePresence>
							{terminal_lines.map((line) => (
								<motion.div
									key={line.id}
									className={`terminal-line${line.is_error ? " error" : ""}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.12 }}
								>
									{line.text}
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</div>
			</div>

			{/* Connector arrow */}
			<div
				className={`hero-demo-connector${connector_active ? " active" : ""}`}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 5v14m-4-4l4 4 4-4" />
				</svg>
				<span>piped to log files</span>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 5v14m-4-4l4 4 4-4" />
				</svg>
			</div>

			{/* Log output panel */}
			<div className="hero-demo-logs">
				<div className="logs-chrome">
					<span className="logs-path">tmp/logs/latest/</span>
					<div className="log-tabs">
						{["combined.log", "fe.log", "api.log"].map((f) => (
							<button
								key={f}
								className={`log-tab${active_tab === f ? " active" : ""}`}
								onClick={() => set_active_tab(f)}
							>
								{f}
							</button>
						))}
					</div>
				</div>
				<div className="logs-body">
					<AnimatePresence>
						{log_entries
							.filter((e) => {
								if (active_tab === "combined.log") return true;
								if (active_tab === "fe.log") return e.source === "fe";
								return e.source === "api";
							})
							.map((entry) => (
								<motion.div
									key={entry.id}
									className={`log-line level-${entry.level.toLowerCase()}`}
									initial={{ opacity: 0, x: -6 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.15 }}
								>
									<span className="log-time">[{entry.time}]</span>
									<span className="log-source">[{entry.source}]</span>
									<span
										className={`log-level level-${entry.level.toLowerCase()}`}
									>
										[{entry.level}]
									</span>
									<span className="log-msg">{entry.message}</span>
								</motion.div>
							))}
					</AnimatePresence>
				</div>
			</div>

			{/* Claude Code panel */}
			<div className="hero-demo-claude">
				<div className="claude-chrome">
					<span className="claude-icon">&#9670;</span>
					<span>Claude Code</span>
				</div>
				<div className="claude-body" ref={claude_body_ref}>
					{claude_messages.map((msg, i) => (
						<div key={i} className={`claude-msg ${msg.role}`}>
							<div className="msg-role">
								{msg.role === "user" ? "You" : "Claude"}
							</div>
							<div className="msg-text">{msg.text}</div>
						</div>
					))}
					{typing_role && (
						<div className={`claude-msg ${typing_role} typing`}>
							<div className="msg-role">
								{typing_role === "user" ? "You" : "Claude"}
							</div>
							<div className="msg-text">
								{typed_text}
								<span className="cursor-blink">|</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
