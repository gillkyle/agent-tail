#!/usr/bin/env bun

const lines = [
    ["\x1b[31mERROR\x1b[0m", "something spicy happened"],
    ["\x1b[33mWARN\x1b[0m", "this is probably fine"],
    ["\x1b[32mOK\x1b[0m", "still alive and noisy"],
    ["\x1b[36mINFO\x1b[0m", "streaming colorful logs"],
]

const colors_enabled = process.env.NO_COLOR === undefined

function maybe_color(text) {
    return colors_enabled ? text : text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
}

let index = 0

const timer = setInterval(() => {
    const [level, message] = lines[index % lines.length]
    const dim = maybe_color("\x1b[2m")
    const reset = maybe_color("\x1b[0m")
    const stamp = new Date().toISOString()

    console.log(`${dim}${stamp}${reset} ${maybe_color(level)} ${message}`)
    index += 1
}, 700)

function shutdown() {
    clearInterval(timer)
    process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

console.log(maybe_color("\x1b[35mcolor demo started\x1b[0m"))
