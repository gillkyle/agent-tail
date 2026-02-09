"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function APIReferencePage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>API Reference</h1>
          <p className="tagline">Configuration options, types, and formats</p>
        </header>

        <section>
          <h2 id="options">BrowserLogsOptions</h2>
          <p>All options are optional with sensible defaults. Pass them to <code>agentTail()</code> (Vite) or <code>withAgentTail()</code> (Next.js).</p>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">logDir</code>
                <span className="prop-type">string</span>
                <span className="prop-default">default: &quot;tmp/logs&quot;</span>
              </div>
              <p className="prop-desc">Directory for log storage, relative to project root</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">logFileName</code>
                <span className="prop-type">string</span>
                <span className="prop-default">default: &quot;browser.log&quot;</span>
              </div>
              <p className="prop-desc">Log file name within each session directory</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">maxLogSessions</code>
                <span className="prop-type">number</span>
                <span className="prop-default">default: 10</span>
              </div>
              <p className="prop-desc">Maximum number of log session directories to retain</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">endpoint</code>
                <span className="prop-type">string</span>
                <span className="prop-default">default: &quot;/__browser-logs&quot;</span>
              </div>
              <p className="prop-desc">Server endpoint path for receiving log batches</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">flushInterval</code>
                <span className="prop-type">number</span>
                <span className="prop-default">default: 500</span>
              </div>
              <p className="prop-desc">Client-side flush interval in milliseconds</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">maxBatchSize</code>
                <span className="prop-type">number</span>
                <span className="prop-default">default: 50</span>
              </div>
              <p className="prop-desc">Client-side max batch size before immediate flush</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">maxSerializeLength</code>
                <span className="prop-type">number</span>
                <span className="prop-default">default: 2000</span>
              </div>
              <p className="prop-desc">Max character length for serialized objects in client</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">warnOnMissingGitignore</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: true</span>
              </div>
              <p className="prop-desc">Warn in terminal if logDir is not in .gitignore</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">levels</code>
                <span className="prop-type">string[]</span>
                <span className="prop-default">default: [&quot;log&quot;, &quot;warn&quot;, &quot;error&quot;, &quot;info&quot;, &quot;debug&quot;]</span>
              </div>
              <p className="prop-desc">Console methods to intercept</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">captureErrors</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: true</span>
              </div>
              <p className="prop-desc">Capture unhandled window errors</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">captureRejections</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: true</span>
              </div>
              <p className="prop-desc">Capture unhandled promise rejections</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">excludes</code>
                <span className="prop-type">string[]</span>
                <span className="prop-default">default: []</span>
              </div>
              <p className="prop-desc">Patterns to exclude from logs. Plain strings are substring matches; strings starting with <code>/</code> are parsed as regex (e.g. <code>/^HMR/i</code>). Filtering runs both client-side and server-side.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 id="cli-commands">CLI commands</h2>

          <h3><code>agent-tail run</code></h3>
          <p>Spawn one or more commands with unified logging. Each argument is a <code>name: command</code> pair:</p>
          <CodeBlock
            code={`agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'`}
            language="bash"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Creates a session directory, spawns all services, prefixes output with <code>[name]</code>, and writes individual + combined log files.
          </p>

          <h3><code>agent-tail wrap</code></h3>
          <p>Wrap a single command and write its output to a named log file in the current session:</p>
          <CodeBlock code="agent-tail wrap server -- npm run dev" language="bash" />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Useful when you want to add a service to an existing session created by <code>agent-tail init</code> or a framework plugin.
          </p>

          <h3><code>agent-tail init</code></h3>
          <p>Create a new log session directory without running any commands:</p>
          <CodeBlock code="agent-tail init" language="bash" />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Sets up the session directory and <code>latest</code> symlink. Useful when other tools (like framework plugins) will write to the session.
          </p>
        </section>

        <section>
          <h2 id="cli-options">CLI options</h2>
          <p>Shared options for <code>agent-tail run</code>, <code>agent-tail wrap</code>, and <code>agent-tail init</code>:</p>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">--log-dir &lt;dir&gt;</code>
              </div>
              <p className="prop-desc">Log directory relative to cwd (default: tmp/logs)</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">--max-sessions &lt;n&gt;</code>
              </div>
              <p className="prop-desc">Max sessions to keep (default: 10)</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">--no-combined</code>
              </div>
              <p className="prop-desc">Don&apos;t write to combined.log</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">--exclude &lt;pattern&gt;</code>
              </div>
              <p className="prop-desc">Exclude lines matching pattern (repeatable). Plain strings are substring matches; strings starting with <code>/</code> are parsed as regex. Filters log <em>content</em> &mdash; matching lines are not written to any log file.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">--mute &lt;name&gt;</code>
              </div>
              <p className="prop-desc">Mute a service by name from terminal output and combined.log (repeatable). The service still runs and logs to its individual <code>&lt;name&gt;.log</code> file. Only applies to <code>agent-tail run</code>.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 id="log-entry">LogEntry type</h2>
          <CodeBlock
            code={`interface LogEntry {
    level: string
    args: string[]
    timestamp: string
    url?: string
    stack?: string
}`}
            language="typescript"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            This is the shape of each log entry sent from the browser to the dev server via the <code>sendBeacon</code> API.
          </p>
        </section>

        <section>
          <h2 id="log-format">Log format specification</h2>
          <CodeBlock
            code={`[HH:MM:SS.mmm] [LEVEL  ] message (url)
    stack trace line 1
    stack trace line 2`}
            language="bash"
          />
          <p>
            The level field is padded to 7 characters for alignment. Stack traces are indented with 4 spaces. The URL is only included for errors that have source location info.
          </p>
        </section>

        <section>
          <h2 id="directory-structure">Directory structure</h2>
          <CodeBlock
            code={`your-project/
├── tmp/
│   └── logs/
│       ├── 2024-01-15T10-30-00-123Z/
│       │   ├── browser.log
│       │   ├── api.log
│       │   ├── worker.log
│       │   └── combined.log
│       ├── 2024-01-15T11-45-00-456Z/
│       │   └── browser.log
│       └── latest -> 2024-01-15T11-45-00-456Z/
└── vite.config.ts`}
            language="bash"
          />
          <p>
            The <code>latest</code> symlink is updated atomically on each new session. Individual service log files are created by <code>agent-tail run</code> or <code>agent-tail wrap</code>. The <code>combined.log</code> contains all output interleaved with <code>[name]</code> prefixes.
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
