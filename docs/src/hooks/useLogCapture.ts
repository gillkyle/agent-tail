"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface CapturedLogEntry {
  level: string;
  args: string[];
  timestamp: string;
}

interface UseLogCaptureOptions {
  levels: string[];
  excludes: string[];
  captureErrors?: boolean;
  captureRejections?: boolean;
  maxEntries?: number;
}

function should_exclude(message: string, excludes: string[]): boolean {
  for (const pattern of excludes) {
    if (pattern.startsWith("/")) {
      try {
        const last_slash = pattern.lastIndexOf("/");
        const source = last_slash > 0 ? pattern.slice(1, last_slash) : pattern.slice(1);
        const flags = last_slash > 0 ? pattern.slice(last_slash + 1) : "";
        const regex = new RegExp(source, flags);
        if (regex.test(message)) return true;
      } catch {
        // invalid regex, skip
      }
    } else {
      if (message.includes(pattern)) return true;
    }
  }
  return false;
}

function get_timestamp(): string {
  const d = new Date();
  return (
    d.toTimeString().slice(0, 8) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

function serialize(arg: unknown): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (arg instanceof Error) return arg.stack || arg.message || String(arg);
  if (typeof arg === "string") return arg;
  try {
    const s = JSON.stringify(arg, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + "..." : s;
  } catch {
    return String(arg);
  }
}

export function useLogCapture(options: UseLogCaptureOptions) {
  const [entries, setEntries] = useState<CapturedLogEntry[]>([]);
  const originals = useRef<Record<string, (...args: unknown[]) => void>>({});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    const maxEntries = options.maxEntries ?? 200;
    const methods = ["log", "warn", "error", "info", "debug"];

    function addEntry(level: string, serialized: string[]) {
      const message = serialized.join(" ");
      const currentOpts = optionsRef.current;
      if (!currentOpts.levels.includes(level)) return;
      if (
        currentOpts.excludes.length &&
        should_exclude(message, currentOpts.excludes)
      )
        return;

      const entry: CapturedLogEntry = {
        level,
        args: serialized,
        timestamp: get_timestamp(),
      };
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > maxEntries ? next.slice(-maxEntries) : next;
      });
    }

    for (const method of methods) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const original = (console as any)[method] as (
        ...args: unknown[]
      ) => void;
      if (!original) continue;
      originals.current[method] = original;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[method] = (...args: unknown[]) => {
        original.apply(console, args);
        addEntry(method, args.map(serialize));
      };
    }

    const onError = (event: ErrorEvent) => {
      if (!optionsRef.current.captureErrors) return;
      const msg = event.error
        ? serialize(event.error)
        : event.message || "Unknown error";
      addEntry("error", ["[uncaught]", msg]);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!optionsRef.current.captureRejections) return;
      const msg = event.reason
        ? serialize(event.reason)
        : "Unhandled promise rejection";
      addEntry("error", ["[unhandled rejection]", msg]);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      for (const method of methods) {
        if (originals.current[method]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (console as any)[method] = originals.current[method];
        }
      }
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, clear };
}
