#!/usr/bin/env bun

const use_color = process.env.FORCE_COLOR === "1"

const lines = [
    ["ERROR", "something spicy happened", "\x1b[31m"],
    ["WARN", "this is probably fine", "\x1b[33m"],
    ["OK", "still alive and noisy", "\x1b[32m"],
    ["INFO", "streaming colorful logs", "\x1b[36m"],
    ["DONE", "five lines, no bullshit", "\x1b[35m"],
]

for (const [level, message, color] of lines) {
    const label = use_color ? `${color}${level}\x1b[0m` : level
    console.log(`${label} ${message}`)
}
