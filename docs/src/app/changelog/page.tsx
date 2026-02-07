"use client";

import { Footer } from "../Footer";
import { ReactNode } from "react";

type ChangeType = "added" | "fixed" | "improved" | "removed";

interface Change {
  type: ChangeType;
  text: ReactNode;
}

interface Release {
  version: string;
  date: string;
  summary?: string;
  changes?: Change[];
}

const badgeLabels: Record<ChangeType, string> = {
  added: "Added",
  fixed: "Fixed",
  improved: "Improved",
  removed: "Removed",
};

const releases: Release[] = [
  {
    version: "0.1.0",
    date: "February 2026",
    summary: "Initial release. Vite plugin, Next.js plugin, and CLI for piping browser console logs to files on disk.",
    changes: [
      { type: "added", text: "Vite plugin with automatic script injection and log ingestion" },
      { type: "added", text: "Next.js plugin with config wrapper, API route handler, and script component" },
      { type: "added", text: <>CLI commands: <code>agent-tail run</code>, <code>agent-tail wrap</code>, <code>agent-tail init</code></> },
      { type: "added", text: "Timestamped session directories with latest symlink" },
      { type: "added", text: "Auto-pruning of old sessions" },
      { type: "added", text: "Combined log file for multi-server setups" },
      { type: "added", text: "Gitignore detection and warnings" },
      { type: "added", text: "Configurable console method interception" },
      { type: "added", text: "Unhandled error and promise rejection capture" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>Changelog</h1>
          <p className="tagline">Release history</p>
        </header>

        {releases.map((release) => (
          <section key={release.version}>
            <h2>
              <span className="sketchy-underline" style={{ "--marker-color": "#febc2e" } as React.CSSProperties}>
                {release.version}
              </span>
              <span
                style={{
                  fontWeight: 400,
                  color: "rgba(0, 0, 0, 0.35)",
                  marginLeft: "0",
                }}
              >
                {release.date}
              </span>
            </h2>

            {release.summary && <p>{release.summary}</p>}

            {release.changes && release.changes.length > 0 && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(["added", "improved", "fixed", "removed"] as ChangeType[]).map((type) => {
                  const items = release.changes!.filter((c) => c.type === type);
                  if (items.length === 0) return null;
                  return (
                    <div key={type}>
                      <div
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: "rgba(0, 0, 0, 0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {badgeLabels[type]}
                      </div>
                      <ul>
                        {items.map((change, j) => (
                          <li key={j}>{change.text}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </article>

      <Footer />
    </>
  );
}
