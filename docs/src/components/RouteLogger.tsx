"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Logs route changes and common page lifecycle events to console
 * so they appear in the playground toolbar.
 */
export function RouteLogger() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const mountTime = useRef(Date.now());

  // Route change logging
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      console.log(
        `[router] navigated to ${pathname} (from ${prevPathname.current})`
      );
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Page lifecycle events
  useEffect(() => {
    console.info(`[page] loaded ${pathname} in ${Date.now() - mountTime.current}ms`);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.debug("[page] tab hidden");
      } else {
        console.debug("[page] tab visible");
      }
    };

    const handleOnline = () => console.info("[network] back online");
    const handleOffline = () => console.warn("[network] went offline");

    const handleResize = debounce(() => {
      console.debug(
        `[viewport] resized to ${window.innerWidth}x${window.innerHeight}`
      );
    }, 500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
