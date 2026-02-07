"use client";

import { useToolbar } from "./ToolbarContext";
import { OptionsPanel } from "./OptionsPanel";
import { LogViewer } from "./LogViewer";
import { motion, AnimatePresence } from "framer-motion";

export function Toolbar() {
  const { expanded, setExpanded, entries } = useToolbar();

  return (
    <div className="playground-toolbar">
      <button
        className="toolbar-collapse-bar"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="toolbar-bar-label">
          <span className="toolbar-bar-icon">&gt;_</span>
          agent-tail playground
          {entries.length > 0 && (
            <span className="toolbar-bar-badge">{entries.length}</span>
          )}
        </span>
        <span
          className="toolbar-chevron"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          &#9650;
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="toolbar-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 360, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="toolbar-split">
              <OptionsPanel />
              <div className="toolbar-divider" />
              <LogViewer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
