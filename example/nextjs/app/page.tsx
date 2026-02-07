"use client"

export default function Home() {
    return (
        <main>
            <h1>agent-tail Next.js example</h1>
            <p>
                Open the console and check{" "}
                <code>tmp/logs/latest/browser.log</code>
            </p>
            <button onClick={() => console.log("Button clicked!", { timestamp: Date.now() })}>
                Log something
            </button>
            <button onClick={() => console.warn("Warning from UI")}>
                Warn something
            </button>
            <button onClick={() => { throw new Error("Intentional test error") }}>
                Throw error
            </button>
        </main>
    )
}
