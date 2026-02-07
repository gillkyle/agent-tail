import { AgentTailScript } from "../../../packages/next-plugin/src/script"

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                {process.env.NODE_ENV === "development" && <AgentTailScript />}
            </head>
            <body>{children}</body>
        </html>
    )
}
