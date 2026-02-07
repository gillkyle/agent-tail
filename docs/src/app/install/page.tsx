"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

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
            There are two ways to use agent-tail. The <strong>CLI</strong> wraps any command (or commands!) and captures their stdout/stderr to log files &mdash; no plugins, no config, works with any stack. The <strong>framework plugins</strong> (Vite, Next.js) capture browser <code>console.*</code> output by injecting a small script into your HTML. Use both together to get server and browser logs in one place.
          </p>
        </section>

        <section>
          <h2 id="vite">Vite</h2>
          <CodeBlock code="npm install -D vite-plugin-agent-tail" language="bash" copyable />
          <CodeBlock
            code={`// vite.config.ts
import { defineConfig } from "vite"
import { agentTail } from "vite-plugin-agent-tail"

export default defineConfig({
    plugins: [agentTail()],
})`}
            language="typescript"
          />
          <p>Then in another terminal:</p>
          <CodeBlock code="tail -f tmp/logs/latest/browser.log" language="bash" copyable />
        </section>

        <section>
          <h2 id="nextjs">Next.js</h2>
          <CodeBlock code="npm install -D next-plugin-agent-tail" language="bash" copyable />
          <h3>1. Wrap your Next.js config</h3>
          <CodeBlock
            code={`// next.config.ts
import { withAgentTail } from "next-plugin-agent-tail"

export default withAgentTail({
    // your Next.js config
})`}
            language="typescript"
          />
          <h3>2. Add the script to your layout</h3>
          <CodeBlock
            code={`// app/layout.tsx
import { AgentTailScript } from "next-plugin-agent-tail/script"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                {process.env.NODE_ENV === "development" && <AgentTailScript />}
            </head>
            <body>{children}</body>
        </html>
    )
}`}
            language="tsx"
          />
          <h3>3. Create the API route</h3>
          <CodeBlock
            code={`// app/api/__browser-logs/route.ts
export { POST } from "next-plugin-agent-tail/handler"`}
            language="typescript"
          />
        </section>

        <section>
          <h2 id="cli">CLI</h2>
          <p>
            The <code>agent-tail</code> CLI wraps any dev server command (or commands!) and pipes their output into the unified log session.
          </p>
          <CodeBlock code="npm install -D agent-tail-core" language="bash" copyable />
          <h3><code>agent-tail run</code></h3>
          <p>Start everything with unified logging:</p>
          <CodeBlock
            code={`{
    "scripts": {
        "dev": "agent-tail run 'fe: npm run dev' 'api: uv run server' 'worker: uv run worker'"
    }
}`}
            language="json"
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            Creates a session directory, spawns all services, prefixes output with <code>[name]</code>, and writes individual + combined log files.
          </p>

          <h3><code>agent-tail wrap</code></h3>
          <p>Wrap a single command:</p>
          <CodeBlock code="npx agent-tail wrap server -- npm run dev" language="bash" copyable />

          <h3><code>agent-tail init</code></h3>
          <p>Create a new log session directory:</p>
          <CodeBlock code="npx agent-tail init" language="bash" copyable />
        </section>

        <section>
          <h2 id="gitignore">.gitignore setup</h2>
          <p>Add your log directory to <code>.gitignore</code>:</p>
          <CodeBlock code={`# .gitignore\ntmp/`} language="bash" />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
            The plugin warns on startup if the log directory isn&apos;t gitignored. Disable with <code>warnOnMissingGitignore: false</code>.
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
