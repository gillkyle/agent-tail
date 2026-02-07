console.log("Page loaded at", new Date().toISOString())
console.info("This is an info message")
console.debug("Debug data:", { count: 42, items: ["a", "b", "c"] })

document.getElementById("log-btn")?.addEventListener("click", () => {
    console.log("Button clicked!", { timestamp: Date.now() })
})

document.getElementById("warn-btn")?.addEventListener("click", () => {
    console.warn("This is a warning from the UI")
})

document.getElementById("error-btn")?.addEventListener("click", () => {
    throw new Error("Intentional test error")
})
