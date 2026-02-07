import React from "react"
import type { BrowserLogsOptions } from "agent-tail-core"
import { resolve_options, generate_client_script } from "agent-tail-core"

interface BrowserLogsScriptProps {
    options?: BrowserLogsOptions
}

/**
 * React component that injects the browser log capture script.
 *
 * Usage in app/layout.tsx:
 *   import { BrowserLogsScript } from "next-plugin-browser-logs/script"
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <head>
 *           {process.env.NODE_ENV === "development" && <BrowserLogsScript />}
 *         </head>
 *         <body>{children}</body>
 *       </html>
 *     )
 *   }
 */
export function BrowserLogsScript({ options: user_options }: BrowserLogsScriptProps = {}) {
    const options = resolve_options(user_options)
    const script = generate_client_script(options)

    return (
        <script
            dangerouslySetInnerHTML={{ __html: script }}
            suppressHydrationWarning
        />
    )
}
