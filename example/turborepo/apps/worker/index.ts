console.log("Worker started at", new Date().toISOString())

let count = 0
setInterval(() => {
    count++
    console.log(`Heartbeat #${count} at ${new Date().toISOString()}`)
}, 3000)
