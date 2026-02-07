"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function FeaturesPage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>Features</h1>
          <p className="tagline">Everything agent-tail can do</p>
        </header>

        <section>
          <h2 id="session-management">Session management</h2>
          <p>
            Each dev server start creates a new timestamped session directory. A <code>latest</code> symlink always points to the most recent session, so <code>tail -f tmp/logs/latest/browser.log</code> always works.
          </p>
          <ul>
            <li><strong>Timestamped directories</strong> &mdash; e.g. <code>2024-01-15T10-30-00-123Z/</code></li>
            <li><strong>Latest symlink</strong> &mdash; always points to the newest session</li>
            <li><strong>Auto-pruning</strong> &mdash; old sessions beyond the limit are removed (default: keep 10)</li>
            <li><strong>Gitignore detection</strong> &mdash; warns if your log directory isn&apos;t in <code>.gitignore</code></li>
          </ul>
        </section>

        <section>
          <h2 id="log-format">Log format</h2>
          <CodeBlock
            code={`[HH:MM:SS.mmm] [LEVEL  ] message (url)
    stack trace line 1
    stack trace line 2`}
            language="bash"
          />
          <p>Example output:</p>
          <CodeBlock
            code={`[10:30:00.123] [LOG    ] User clicked button
[10:30:00.456] [WARN   ] Deprecated API call
[10:30:01.789] [ERROR  ] Failed to fetch data (http://localhost:5173/src/api.ts:42:10)
    Error: Network error
        at fetchData (http://localhost:5173/src/api.ts:42:10)
        at handleClick (http://localhost:5173/src/app.ts:15:5)`}
            language="bash"
          />
        </section>

        <section>
          <h2 id="cli-commands">CLI commands</h2>

          <h3><code>agent-tail run</code></h3>
          <p>The easiest way to use agent-tail. Add it to <code>package.json</code> and forget about it:</p>
          <CodeBlock
            code={`{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'"
    }
}`}
            language="json"
          />
          <p>This creates a session, spawns all services concurrently, prefixes each line with <code>[name]</code> (color-coded), writes individual log files, and writes a <code>combined.log</code> with all output interleaved.</p>

          <h3><code>agent-tail wrap</code></h3>
          <p>Wraps a single command, piping its stdout/stderr to a named log file in the current session:</p>
          <CodeBlock
            code={`npx agent-tail wrap api -- uv run fastapi-server
npx agent-tail wrap worker -- python -m celery worker -A myapp`}
            language="bash"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            If no session exists yet, <code>wrap</code> creates one automatically. If a session already exists (e.g. started by the Vite plugin), it reuses it.
          </p>

          <h3><code>agent-tail init</code></h3>
          <p>Creates a new log session directory and prints the path:</p>
          <CodeBlock code="npx agent-tail init" language="bash" />
        </section>

        <section>
          <h2 id="multi-server">Multi-server log aggregation</h2>
          <p>Three ways to unify logs from multiple servers:</p>

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
          <h2 id="captured-events">Captured events</h2>
          <p>Beyond console methods, the plugin captures:</p>
          <ul>
            <li><strong>Unhandled errors</strong> (<code>window.onerror</code>) &mdash; logged as <code>UNCAUGHT_ERROR</code></li>
            <li><strong>Unhandled promise rejections</strong> &mdash; logged as <code>UNHANDLED_REJECTION</code></li>
          </ul>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Disable with <code>captureErrors: false</code> and <code>captureRejections: false</code>.
          </p>
        </section>

        <section>
          <h2 id="agent-setup">Agent setup</h2>
          <p>
            Tell your AI agent where the logs are. Add a snippet like this to your project&apos;s agent instructions file (<code>CLAUDE.md</code>, <code>.cursorrules</code>, or equivalent):
          </p>
          <CodeBlock
            code={`## Dev Logs

All dev server output is piped to \`tmp/logs/\`. The latest session is
symlinked at \`tmp/logs/latest/\`. Browser console output (console.log,
console.warn, console.error, unhandled errors, unhandled promise rejections)
is automatically captured to \`tmp/logs/latest/browser.log\` via a Vite plugin
during development.

When debugging, always check recent logs before guessing:

    grep -ri "error\\|warn" tmp/logs/latest/
    tail -50 tmp/logs/latest/browser.log`}
            language="markdown"
          />
          <p>This gives the agent passive context about where runtime truth lives, so it reads logs instead of speculating.</p>
        </section>
      </article>

      <Footer />
    </>
  );
}
