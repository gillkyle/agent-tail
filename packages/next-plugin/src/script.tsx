import type { BrowserLogsOptions } from "agent-tail-core"
import { resolve_options, generate_client_script } from "agent-tail-core"

interface AgentTailScriptProps {
    options?: BrowserLogsOptions
}

/**
 * React component that injects the browser log capture script.
 *
 * Usage in app/layout.tsx:
 *   import { AgentTailScript } from "next-plugin-agent-tail/script"
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <head>
 *           {process.env.NODE_ENV === "development" && <AgentTailScript />}
 *         </head>
 *         <body>{children}</body>
 *       </html>
 *     )
 *   }
 */
export function AgentTailScript({ options: user_options }: AgentTailScriptProps = {}) {
    const options = resolve_options(user_options)
    const script = generate_client_script(options)

    return (
        <script
            dangerouslySetInnerHTML={{ __html: script }}
            suppressHydrationWarning
        />
    )
}
