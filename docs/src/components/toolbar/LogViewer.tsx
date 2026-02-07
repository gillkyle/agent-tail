"use client";

import { useEffect, useRef } from "react";
import { useToolbar } from "./ToolbarContext";

const LEVEL_COLORS: Record<string, string> = {
  log: "rgba(0,0,0,0.6)",
  info: "#2563eb",
  warn: "#d97706",
  error: "#dc2626",
  debug: "#7c3aed",
};

export function LogViewer() {
  const { entries, clearLogs } = useToolbar();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="toolbar-log-viewer">
      <div className="toolbar-log-header">
        <span className="toolbar-log-count">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <button onClick={clearLogs} className="toolbar-btn-clear">
          Clear
        </button>
      </div>
      <div className="toolbar-log-scroll" ref={scrollRef}>
        {entries.length === 0 ? (
          <div className="toolbar-log-empty">
            No logs captured yet. Open your browser console or interact with the
            page.
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className={`toolbar-log-entry level-${entry.level}`}>
              <span className="toolbar-log-time">{entry.timestamp}</span>
              <span
                className="toolbar-log-level"
                style={{ color: LEVEL_COLORS[entry.level] || "#666" }}
              >
                {entry.level.toUpperCase().padEnd(5)}
              </span>
              <span className="toolbar-log-msg">
                {entry.args.join(" ")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
