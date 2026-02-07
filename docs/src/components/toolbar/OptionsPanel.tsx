"use client";

import { useState } from "react";
import { useToolbar } from "./ToolbarContext";

const ALL_LEVELS = ["log", "warn", "error", "info", "debug"];

export function OptionsPanel() {
  const {
    levels,
    setLevels,
    excludes,
    setExcludes,
    flushInterval,
    setFlushInterval,
    maxBatchSize,
    setMaxBatchSize,
    maxSerializeLength,
    setMaxSerializeLength,
    captureErrors,
    setCaptureErrors,
    captureRejections,
    setCaptureRejections,
  } = useToolbar();
  const [excludeInput, setExcludeInput] = useState("");

  function toggleLevel(level: string) {
    if (levels.includes(level)) {
      setLevels(levels.filter((l) => l !== level));
    } else {
      setLevels([...levels, level]);
    }
  }

  function addExclude() {
    const trimmed = excludeInput.trim();
    if (trimmed && !excludes.includes(trimmed)) {
      setExcludes([...excludes, trimmed]);
    }
    setExcludeInput("");
  }

  function removeExclude(pattern: string) {
    setExcludes(excludes.filter((e) => e !== pattern));
  }

  return (
    <div className="toolbar-options">
      <div className="toolbar-options-section">
        <label className="toolbar-label">Levels</label>
        <div className="toolbar-checkboxes">
          {ALL_LEVELS.map((level) => (
            <label key={level} className="toolbar-checkbox">
              <input
                type="checkbox"
                checked={levels.includes(level)}
                onChange={() => toggleLevel(level)}
              />
              <span className={`toolbar-level-tag level-${level}`}>
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="toolbar-options-section">
        <label className="toolbar-label">Excludes</label>
        <div className="toolbar-exclude-input">
          <input
            type="text"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExclude()}
            placeholder="substring or /regex/"
          />
          <button onClick={addExclude} className="toolbar-btn-add">
            +
          </button>
        </div>
        {excludes.length > 0 && (
          <div className="toolbar-exclude-tags">
            {excludes.map((pattern) => (
              <span key={pattern} className="toolbar-exclude-tag">
                {pattern}
                <button onClick={() => removeExclude(pattern)}>&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-options-section">
        <label className="toolbar-label">Settings</label>
        <div className="toolbar-settings-grid">
          <label className="toolbar-setting">
            <span>flushInterval</span>
            <input
              type="number"
              value={flushInterval}
              onChange={(e) => setFlushInterval(Number(e.target.value))}
              min={100}
              step={100}
            />
          </label>
          <label className="toolbar-setting">
            <span>maxBatchSize</span>
            <input
              type="number"
              value={maxBatchSize}
              onChange={(e) => setMaxBatchSize(Number(e.target.value))}
              min={1}
            />
          </label>
          <label className="toolbar-setting">
            <span>maxSerializeLength</span>
            <input
              type="number"
              value={maxSerializeLength}
              onChange={(e) => setMaxSerializeLength(Number(e.target.value))}
              min={100}
              step={100}
            />
          </label>
        </div>
      </div>

      <div className="toolbar-options-section">
        <div className="toolbar-toggles">
          <label className="toolbar-toggle">
            <input
              type="checkbox"
              checked={captureErrors}
              onChange={(e) => setCaptureErrors(e.target.checked)}
            />
            <span>captureErrors</span>
          </label>
          <label className="toolbar-toggle">
            <input
              type="checkbox"
              checked={captureRejections}
              onChange={(e) => setCaptureRejections(e.target.checked)}
            />
            <span>captureRejections</span>
          </label>
        </div>
      </div>
    </div>
  );
}
