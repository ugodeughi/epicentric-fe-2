// Fails when the dev port is already taken, on IPv4 or IPv6. Nuxt alone would start
// anyway: on a random port, or next to a process bound to the other address family,
// which then answers in its place on http://localhost.
import { createServer } from 'node:net'

const port = Number(process.argv[2])

/** @param {string} host */
function isFree(host) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', (error) => resolve(error.code !== 'EADDRINUSE'))
    server.listen(port, host, () => server.close(() => resolve(true)))
  })
}

for (const host of ['127.0.0.1', '::1', '0.0.0.0', '::']) {
  if (!(await isFree(host))) {
    console.error(`Port ${port} is already in use (${host}): stop that process, do not move to another port.`)
    process.exit(1)
  }
}
