import type { ResolvedOptions } from "./types"

export function generate_client_script(options: ResolvedOptions): string {
    return `(function() {
    var BATCH = [];
    var FLUSH_INTERVAL = ${options.flushInterval};
    var MAX_BATCH = ${options.maxBatchSize};
    var MAX_SERIALIZE = ${options.maxSerializeLength};
    var ENDPOINT = ${JSON.stringify(options.endpoint)};
    var LEVELS = ${JSON.stringify(options.levels)};
    var EXCLUDES = ${JSON.stringify(options.excludes)};
    var CAPTURE_ERRORS = ${options.captureErrors};
    var CAPTURE_REJECTIONS = ${options.captureRejections};
    var timer = null;

    function should_exclude(msg) {
        for (var i = 0; i < EXCLUDES.length; i++) {
            var p = EXCLUDES[i];
            if (p.charAt(0) === "/") {
                try {
                    var li = p.lastIndexOf("/");
                    var src = li > 0 ? p.slice(1, li) : p.slice(1);
                    var fl = li > 0 ? p.slice(li + 1) : "";
                    if (new RegExp(src, fl).test(msg)) return true;
                } catch(e) {}
            } else {
                if (msg.indexOf(p) !== -1) return true;
            }
        }
        return false;
    }

    function serialize(arg) {
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (arg instanceof Error) return arg.stack || arg.message || String(arg);
        if (typeof arg === "string") return arg;
        try {
            var s = JSON.stringify(arg, null, 2);
            return s.length > MAX_SERIALIZE ? s.slice(0, MAX_SERIALIZE) + "..." : s;
        } catch(e) {
            return String(arg);
        }
    }

    function get_timestamp() {
        var d = new Date();
        return d.toTimeString().slice(0, 8) + "." + String(d.getMilliseconds()).padStart(3, "0");
    }

    function queue(level, args, extra) {
        var entry = {
            level: level,
            args: Array.prototype.map.call(args, serialize),
            timestamp: get_timestamp()
        };
        if (extra) {
            if (extra.url) entry.url = extra.url;
            if (extra.stack) entry.stack = extra.stack;
        }
        if (EXCLUDES.length && should_exclude(entry.args.join(" "))) return;
        BATCH.push(entry);
        if (BATCH.length >= MAX_BATCH) flush();
        else if (!timer) timer = setTimeout(flush, FLUSH_INTERVAL);
    }

    function flush() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (!BATCH.length) return;
        var payload = JSON.stringify(BATCH);
        BATCH = [];
        try {
            navigator.sendBeacon(ENDPOINT, payload);
        } catch(e) {
            fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
                keepalive: true
            }).catch(function() {});
        }
    }

    LEVELS.forEach(function(level) {
        var original = console[level];
        if (!original) return;
        console[level] = function() {
            queue(level, arguments);
            return original.apply(console, arguments);
        };
    });

    if (CAPTURE_ERRORS) {
        window.addEventListener("error", function(e) {
            queue("uncaught_error", [e.message], {
                url: e.filename + ":" + e.lineno + ":" + e.colno,
                stack: e.error && e.error.stack ? e.error.stack : undefined
            });
        });
    }

    if (CAPTURE_REJECTIONS) {
        window.addEventListener("unhandledrejection", function(e) {
            var reason = e.reason;
            var msg = reason instanceof Error ? reason.message : String(reason);
            var stack = reason instanceof Error ? reason.stack : undefined;
            queue("unhandled_rejection", [msg], { stack: stack });
        });
    }

    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
})();`
}
