"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";
import { DiffBlock } from "../components/DiffBlock";

export default function FeaturesPage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>Features</h1>
          <p className="tagline">What you get with agent-tail</p>
        </header>

        <section>
          <h2 id="readable-logs">Readable, greppable logs</h2>
          <p>
            Logs are plain text files with a consistent format. Timestamps, levels, source locations, and stack traces are all there &mdash; easy for you to scan and easy for an AI to parse.
          </p>
          <CodeBlock
            code={`[10:30:00.123] [LOG    ] User clicked button
[10:30:00.456] [WARN   ] Deprecated API call
[10:30:01.789] [ERROR  ] Failed to fetch data (http://localhost:5173/src/api.ts:42:10)
    Error: Network error
        at fetchData (http://localhost:5173/src/api.ts:42:10)
        at handleClick (http://localhost:5173/src/app.ts:15:5)`}
            language="bash"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Levels are padded to 7 characters for alignment. Stack traces are indented. Source URLs are included for errors.
          </p>
        </section>

        <section>
          <h2 id="log-filtering">Log filtering</h2>
          <p>
            Not every log line is useful &mdash; HMR updates, noisy debug output, and framework internals add clutter that wastes AI context. The <code>excludes</code> option lets you filter them out before they hit disk.
          </p>
          <DiffBlock
            oldFile={{
              name: "vite.config.ts",
              contents: `import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [agentTail()],
})`,
            }}
            newFile={{
              name: "vite.config.ts",
              contents: `import { defineConfig } from "vite"
import { agentTail } from "agent-tail/vite"

export default defineConfig({
    plugins: [
        agentTail({
            excludes: [
                "[HMR]",           // substring match
                "Download the React DevTools",
                "/^\\[vite\\]/",     // regex match
            ],
        }),
    ],
})`,
            }}
          />
          <p>The CLI supports it too, with repeatable <code>--exclude</code> flags:</p>
          <CodeBlock
            code={`agent-tail run --exclude "[HMR]" --exclude "/^DEBUG/" 'fe: npm run dev'`}
            language="bash"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Plain strings are substring matches. Patterns starting with <code>/</code> are parsed as regex (e.g. <code>/^HMR/i</code>).
          </p>
        </section>

        <section>
          <h2 id="multi-server">Multi-server log aggregation</h2>
          <p>
            Most projects run more than one process &mdash; a frontend, an API, maybe a worker. agent-tail can aggregate all of them into one session directory.
          </p>

          <h3>1. Use <code>agent-tail run</code> (recommended)</h3>
          <p>Run everything from one command. All output goes to the same session automatically.</p>

          <h3>2. Wrap services independently</h3>
          <p>Run each service in its own terminal. The <code>wrap</code> command detects the existing session:</p>
          <CodeBlock
            code={`# Terminal 1: Start the frontend (creates the session)
npm run dev

# Terminal 2: Wrap the API server (reuses the session)
npx agent-tail wrap api -- uv run fastapi-server

# Terminal 3: Tail everything
tail -f tmp/logs/latest/*.log`}
            language="bash"
          />

          <h3>3. Direct file writes (no CLI needed)</h3>
          <p>Point your server&apos;s logging at the <code>latest</code> symlink. Works with any language:</p>
          <CodeBlock
            code={`# Python
log_dir = os.path.join(os.getcwd(), "tmp", "logs", "latest")
handler = logging.FileHandler(os.path.join(log_dir, "api.log"))

# Node.js
const log_stream = fs.createWriteStream(
    path.join("tmp/logs/latest", "server.log"),
    { flags: "a" }
)`}
            language="python"
          />
        </section>

        <section>
          <h2 id="searching-and-tailing">Searching and tailing logs</h2>
          <p>
            Because logs are plain files, every standard Unix tool works out of the box. Here are the most useful patterns:
          </p>
          <CodeBlock
            code={`# Follow all logs in real time
tail -f tmp/logs/latest/*.log

# Follow a specific service
tail -f tmp/logs/latest/browser.log

# Find all errors across every service
grep -r "ERROR" tmp/logs/latest/

# Case-insensitive search
grep -ri "failed\\|timeout\\|exception" tmp/logs/latest/

# Show context around each match
grep -r -C 5 "ERROR" tmp/logs/latest/

# Only ERROR and WARN lines
awk '/\\[ERROR|\\[WARN/' tmp/logs/latest/browser.log

# Count errors per service
grep -rc "ERROR" tmp/logs/latest/

# Use ripgrep for faster searches
rg "ERROR|WARN" tmp/logs/latest/`}
            language="bash"
          />
        </section>

        <section>
          <h2 id="captured-events">Captured browser events</h2>
          <p>The framework plugins capture more than just <code>console.*</code> calls:</p>
          <ul>
            <li><strong>Unhandled errors</strong> (<code>window.onerror</code>) &mdash; logged as <code>UNCAUGHT_ERROR</code> with full stack traces</li>
            <li><strong>Unhandled promise rejections</strong> &mdash; logged as <code>UNHANDLED_REJECTION</code></li>
          </ul>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            These are the errors that silently break your app in the browser. Disable with <code>captureErrors: false</code> and <code>captureRejections: false</code>.
          </p>
        </section>

        <section>
          <h2 id="session-management">Session management</h2>
          <p>
            Each <code>agent-tail run</code> (or dev server start with a
            framework plugin) creates a new <strong>session</strong> &mdash; a
            timestamped directory under <code>tmp/logs/</code> that holds all
            log files for that run. A <code>latest</code> symlink always points
            to the most recent session, so <code>tmp/logs/latest/</code> is
            always the right path to give your agent.
          </p>
          <ul>
            <li><strong>Timestamped directories</strong> &mdash; e.g. <code>2024-01-15T10-30-00-123Z/</code></li>
            <li><strong>Latest symlink</strong> &mdash; updated on every new session, always points to the newest one</li>
            <li><strong>Auto-pruning</strong> &mdash; old sessions beyond the limit are removed (default: keep 10)</li>
            <li><strong>Gitignore detection</strong> &mdash; warns if your log directory isn&apos;t in <code>.gitignore</code></li>
          </ul>
        </section>

      </article>

      <Footer />
    </>
  );
}
