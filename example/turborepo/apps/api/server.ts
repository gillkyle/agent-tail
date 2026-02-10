import { createServer } from "node:http"

const port = 3001

const server = createServer((req, res) => {
    console.log(`${req.method} ${req.url}`)
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", time: new Date().toISOString() }))
})

server.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
})
