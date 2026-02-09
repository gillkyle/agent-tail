"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  useLogCapture,
  type CapturedLogEntry,
} from "../../hooks/useLogCapture";

interface ToolbarState {
  // Options
  levels: string[];
  setLevels: (levels: string[]) => void;
  excludes: string[];
  setExcludes: (excludes: string[]) => void;
  flushInterval: number;
  setFlushInterval: (ms: number) => void;
  maxBatchSize: number;
  setMaxBatchSize: (n: number) => void;
  maxSerializeLength: number;
  setMaxSerializeLength: (n: number) => void;
  captureErrors: boolean;
  setCaptureErrors: (v: boolean) => void;
  captureRejections: boolean;
  setCaptureRejections: (v: boolean) => void;
  // Log entries
  entries: CapturedLogEntry[];
  clearLogs: () => void;
  // UI
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}

const ToolbarContext = createContext<ToolbarState | null>(null);

export function useToolbar() {
  const ctx = useContext(ToolbarContext);
  if (!ctx) throw new Error("useToolbar must be used within ToolbarProvider");
  return ctx;
}

export function ToolbarProvider({ children }: { children: ReactNode }) {
  const [levels, setLevels] = useState([
    "log",
    "warn",
    "error",
    "info",
    "debug",
  ]);
  const [excludes, setExcludes] = useState<string[]>([]);
  const [flushInterval, setFlushInterval] = useState(500);
  const [maxBatchSize, setMaxBatchSize] = useState(50);
  const [maxSerializeLength, setMaxSerializeLength] = useState(2000);
  const [captureErrors, setCaptureErrors] = useState(true);
  const [captureRejections, setCaptureRejections] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/playground") {
      setExpanded(true);
    }
  }, [pathname]);

  const { entries, clear } = useLogCapture({
    levels,
    excludes,
    captureErrors,
    captureRejections,
  });

  return (
    <ToolbarContext.Provider
      value={{
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
        entries,
        clearLogs: clear,
        expanded,
        setExpanded,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
}
