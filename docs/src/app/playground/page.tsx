"use client";

import { useState, useRef } from "react";
import { Footer } from "../Footer";

// ─── Fake data generators ────────────────────────────────────────────────────

const ENDPOINTS = [
  "/api/users",
  "/api/auth/login",
  "/api/products",
  "/api/orders",
  "/api/settings",
  "/api/analytics/events",
];

const STATUS_CODES = [200, 201, 204, 301, 400, 401, 403, 404, 500, 502, 503];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomMs(): number {
  return Math.floor(Math.random() * 2000) + 10;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Playground sections ─────────────────────────────────────────────────────

function BasicLevels() {
  return (
    <div className="playground-section">
      <h3>Console levels</h3>
      <p>Each button fires the corresponding <code>console.*</code> method.</p>
      <div className="playground-btn-row">
        <button
          className="playground-btn level-log"
          onClick={() => console.log("Hello from console.log")}
        >
          console.log
        </button>
        <button
          className="playground-btn level-info"
          onClick={() => console.info("Informational message")}
        >
          console.info
        </button>
        <button
          className="playground-btn level-warn"
          onClick={() => console.warn("This is a warning")}
        >
          console.warn
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => console.error("Something went wrong!")}
        >
          console.error
        </button>
        <button
          className="playground-btn level-debug"
          onClick={() => console.debug("Debug details here")}
        >
          console.debug
        </button>
      </div>
    </div>
  );
}

function ObjectLogging() {
  const sampleUser = {
    id: 42,
    name: "Ada Lovelace",
    email: "ada@example.com",
    roles: ["admin", "editor"],
    preferences: { theme: "dark", notifications: true },
  };

  const sampleArray = [
    { id: 1, title: "Build login page", done: true },
    { id: 2, title: "Add OAuth support", done: false },
    { id: 3, title: "Write unit tests", done: false },
  ];

  return (
    <div className="playground-section">
      <h3>Structured data</h3>
      <p>
        Log objects, arrays, and mixed arguments. Serialized to JSON in the log
        file.
      </p>
      <div className="playground-btn-row">
        <button
          className="playground-btn"
          onClick={() => console.log("User profile:", sampleUser)}
        >
          Log object
        </button>
        <button
          className="playground-btn"
          onClick={() => console.log("Tasks:", sampleArray)}
        >
          Log array
        </button>
        <button
          className="playground-btn"
          onClick={() =>
            console.log(
              "Mixed:",
              42,
              true,
              null,
              undefined,
              { key: "value" },
              [1, 2, 3]
            )
          }
        >
          Mixed types
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            const big = { data: Array.from({ length: 100 }, (_, i) => ({ index: i, value: `item-${i}`, nested: { a: i * 2, b: `str-${i}` } })) };
            console.log("Large payload:", big);
          }}
        >
          Large object
        </button>
      </div>
    </div>
  );
}

function ApiSimulation() {
  const [loading, setLoading] = useState<string | null>(null);

  function simulateRequest(method: string) {
    const endpoint = randomFrom(ENDPOINTS);
    const requestId = randomId();
    const status = randomFrom(STATUS_CODES);
    const duration = randomMs();

    setLoading(method);
    console.info(
      `[api] ${method} ${endpoint} started (req:${requestId})`
    );

    setTimeout(() => {
      if (status >= 500) {
        console.error(
          `[api] ${method} ${endpoint} failed ${status} in ${duration}ms (req:${requestId})`,
        );
      } else if (status >= 400) {
        console.warn(
          `[api] ${method} ${endpoint} client error ${status} in ${duration}ms (req:${requestId})`
        );
      } else {
        console.log(
          `[api] ${method} ${endpoint} responded ${status} in ${duration}ms (req:${requestId})`
        );
      }
      setLoading(null);
    }, Math.min(duration, 800));
  }

  return (
    <div className="playground-section">
      <h3>API request simulation</h3>
      <p>
        Simulates REST calls with random endpoints, status codes, and timings.
      </p>
      <div className="playground-btn-row">
        {["GET", "POST", "PUT", "DELETE"].map((method) => (
          <button
            key={method}
            className={`playground-btn ${loading === method ? "loading" : ""}`}
            onClick={() => simulateRequest(method)}
          >
            {method}
          </button>
        ))}
        <button
          className="playground-btn"
          onClick={() => {
            ["GET", "POST", "PUT", "DELETE"].forEach((m) =>
              simulateRequest(m)
            );
          }}
        >
          Fire all
        </button>
      </div>
    </div>
  );
}

function ErrorSimulation() {
  return (
    <div className="playground-section">
      <h3>Errors &amp; stack traces</h3>
      <p>
        Log <code>Error</code> objects with stack traces, or trigger real
        unhandled errors.
      </p>
      <div className="playground-btn-row">
        <button
          className="playground-btn level-error"
          onClick={() => {
            const err = new Error("Database connection refused");
            console.error("[db]", err);
          }}
        >
          DB error
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            const err = new TypeError(
              "Cannot read properties of undefined (reading 'map')"
            );
            console.error("[render]", err);
          }}
        >
          TypeError
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            try {
              JSON.parse("{invalid json");
            } catch (err) {
              console.error("[parser] Failed to parse config:", err);
            }
          }}
        >
          Parse error
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            const err = new Error("Network request failed");
            (err as any).status = 503;
            (err as any).url = "https://api.example.com/data";
            console.error("[fetch] Request failed:", err.message, {
              status: (err as any).status,
              url: (err as any).url,
            });
          }}
        >
          Network error
        </button>
        <button
          className="playground-btn level-warn"
          onClick={() => {
            console.warn(
              "[deprecation] `user.getFullName()` is deprecated, use `user.displayName` instead"
            );
          }}
        >
          Deprecation
        </button>
      </div>
    </div>
  );
}

function UnhandledErrors() {
  return (
    <div className="playground-section">
      <h3>Unhandled errors &amp; rejections</h3>
      <p>
        These trigger <code>window.onerror</code> and{" "}
        <code>unhandledrejection</code> — caught by{" "}
        <code>captureErrors</code> and <code>captureRejections</code>.
      </p>
      <div className="playground-btn-row">
        <button
          className="playground-btn level-error"
          onClick={() => {
            setTimeout(() => {
              throw new Error("Uncaught exception from setTimeout!");
            }, 0);
          }}
        >
          Throw uncaught
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            Promise.reject(new Error("Unhandled promise rejection!"));
          }}
        >
          Reject promise
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            Promise.reject("String rejection: something broke");
          }}
        >
          String rejection
        </button>
      </div>
    </div>
  );
}

function AppLifecycle() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="playground-section">
      <h3>App lifecycle &amp; state changes</h3>
      <p>Interactive controls that log state transitions and user actions.</p>
      <div className="playground-btn-row">
        <button
          className="playground-btn"
          onClick={() => {
            const next = count + 1;
            setCount(next);
            console.log(`[state] counter incremented to ${next}`);
          }}
        >
          Count: {count}
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            const next = theme === "light" ? "dark" : "light";
            setTheme(next);
            console.log(`[ui] theme switched to "${next}"`);
          }}
        >
          Theme: {theme}
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            console.debug(
              `[perf] component render #${renderCount.current}`
            );
          }}
        >
          Log render count
        </button>
      </div>
      <div className="playground-form">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }));
            console.debug(`[form] name field changed: "${e.target.value}"`);
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, email: e.target.value }));
            console.debug(`[form] email field changed: "${e.target.value}"`);
          }}
        />
        <button
          className="playground-btn"
          onClick={() => {
            if (!formData.name || !formData.email) {
              console.warn("[form] validation failed: missing required fields", formData);
            } else {
              console.log("[form] submitted:", formData);
              console.info(`[api] POST /api/users started`);
              setTimeout(() => {
                console.log(`[api] POST /api/users responded 201 in ${randomMs()}ms`);
                setFormData({ name: "", email: "" });
              }, 400);
            }
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function BatchFirewall() {
  return (
    <div className="playground-section">
      <h3>Burst &amp; flood</h3>
      <p>
        Stress-test the log capture with rapid bursts. Good for testing{" "}
        <code>maxBatchSize</code> and <code>flushInterval</code>.
      </p>
      <div className="playground-btn-row">
        <button
          className="playground-btn"
          onClick={() => {
            for (let i = 0; i < 10; i++) {
              console.log(`[burst] message ${i + 1}/10`);
            }
          }}
        >
          10 logs
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            for (let i = 0; i < 50; i++) {
              console.log(`[flood] message ${i + 1}/50`);
            }
          }}
        >
          50 logs
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            let i = 0;
            const interval = setInterval(() => {
              if (i >= 20) {
                clearInterval(interval);
                console.info("[stream] finished 20 messages");
                return;
              }
              const level = randomFrom(["log", "info", "warn", "error", "debug"] as const);
              (console as any)[level](
                `[stream] ${level} message ${i + 1}/20 — ${randomId()}`
              );
              i++;
            }, 200);
          }}
        >
          Timed stream (20)
        </button>
        <button
          className="playground-btn level-warn"
          onClick={() => {
            console.log("[mixed] Starting mixed burst...");
            console.info("[mixed] Loading user preferences");
            console.debug("[mixed] Cache hit for key: user_prefs_42");
            console.log("[mixed] Rendering dashboard widgets");
            console.warn("[mixed] Widget 'analytics' took 2.3s to render");
            console.error("[mixed] Widget 'notifications' failed to load");
            console.info("[mixed] Falling back to cached notifications");
            console.log("[mixed] Dashboard loaded with 6/7 widgets");
            console.debug("[mixed] Total render time: 3.1s");
            console.warn("[mixed] Performance budget exceeded (target: 2s)");
          }}
        >
          Mixed burst
        </button>
      </div>
    </div>
  );
}

function RealisticScenarios() {
  return (
    <div className="playground-section">
      <h3>Realistic scenarios</h3>
      <p>Multi-step sequences that mimic real application flows.</p>
      <div className="playground-btn-row">
        <button
          className="playground-btn"
          onClick={() => {
            console.info("[auth] login attempt for user@example.com");
            setTimeout(() => {
              console.log("[auth] credentials verified");
              console.debug("[auth] generating JWT token");
              setTimeout(() => {
                console.log("[auth] session created (ttl: 3600s)");
                console.info("[auth] login successful — redirecting to /dashboard");
              }, 300);
            }, 500);
          }}
        >
          Login flow
        </button>
        <button
          className="playground-btn level-error"
          onClick={() => {
            console.info("[auth] login attempt for admin@example.com");
            setTimeout(() => {
              console.warn("[auth] rate limit approaching (8/10 attempts)");
              setTimeout(() => {
                console.error("[auth] authentication failed: invalid password");
                console.warn("[auth] account locked for 5 minutes after 3 more attempts");
              }, 200);
            }, 400);
          }}
        >
          Failed login
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            console.info("[checkout] starting checkout for cart_abc123");
            console.debug("[checkout] cart items:", JSON.stringify([
              { sku: "WIDGET-01", qty: 2, price: 29.99 },
              { sku: "GADGET-05", qty: 1, price: 149.99 },
            ]));
            setTimeout(() => {
              console.log("[checkout] inventory reserved");
              console.info("[payment] charging $209.97 to card ending 4242");
              setTimeout(() => {
                console.log("[payment] charge authorized (txn: ch_" + randomId() + ")");
                console.log("[checkout] order confirmed: ORD-" + randomId().toUpperCase());
                console.info("[email] sending confirmation to user@example.com");
              }, 600);
            }, 400);
          }}
        >
          Checkout flow
        </button>
        <button
          className="playground-btn level-warn"
          onClick={() => {
            console.info("[deploy] deploying v2.4.1 to production...");
            setTimeout(() => {
              console.log("[deploy] building assets...");
              setTimeout(() => {
                console.log("[deploy] assets built (42 files, 1.8MB)");
                console.info("[deploy] running health checks...");
                setTimeout(() => {
                  console.warn("[deploy] health check: /api/search responded slowly (2.4s)");
                  console.log("[deploy] health check: 11/12 services healthy");
                  console.warn("[deploy] deploying with degraded search service");
                  console.info("[deploy] v2.4.1 deployed successfully");
                }, 500);
              }, 400);
            }, 300);
          }}
        >
          Deploy sequence
        </button>
      </div>
    </div>
  );
}

function ExcludeDemo() {
  return (
    <div className="playground-section">
      <h3>Test excludes</h3>
      <p>
        Fire logs with known patterns, then add exclude rules in the toolbar to
        filter them out. Try adding <code>[noisy]</code> or{" "}
        <code>/\\[heartbeat\\]/</code> as excludes.
      </p>
      <div className="playground-btn-row">
        <button
          className="playground-btn"
          onClick={() => {
            console.log("[noisy] polled /api/status — 200 OK");
            console.log("[noisy] polled /api/status — 200 OK");
            console.log("[noisy] polled /api/status — 200 OK");
            console.log("[important] user clicked checkout button");
            console.log("[noisy] polled /api/status — 200 OK");
          }}
        >
          Noisy polling
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            const id = setInterval(() => {
              console.debug("[heartbeat] ping — " + new Date().toISOString());
            }, 400);
            setTimeout(() => {
              clearInterval(id);
              console.info("[heartbeat] stopped after 3s");
            }, 3000);
          }}
        >
          Heartbeat (3s)
        </button>
        <button
          className="playground-btn"
          onClick={() => {
            console.log("[hmr] updated /src/components/Button.tsx");
            console.log("[hmr] updated /src/styles/globals.css");
            console.log("[hmr] updated /src/components/Header.tsx");
            console.info("[app] re-rendered 3 components");
          }}
        >
          HMR noise
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  return (
    <>
      <article className="article playground-article">
        <header>
          <h1>Playground</h1>
          <p className="tagline">
            Trigger sample logs and watch them appear in the toolbar below.
          </p>
        </header>

        <div className="playground-hint">
          <span className="playground-hint-icon">&#9660;</span>
          Click the <strong>agent-tail playground</strong> bar at the bottom
          of the screen to open the log viewer, then press the buttons below.
        </div>

        <BasicLevels />
        <ObjectLogging />
        <ApiSimulation />
        <ErrorSimulation />
        <UnhandledErrors />
        <AppLifecycle />
        <BatchFirewall />
        <RealisticScenarios />
        <ExcludeDemo />
      </article>
      <Footer />
    </>
  );
}
