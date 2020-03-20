import url from 'url'
import { createServer, IncomingMessage } from 'http'
import { Socket } from 'net'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

export interface WebSocketHandler extends EventEmitter {
  handleUpgrade: WebSocket.Server['handleUpgrade']
}

export type Server = ReturnType<typeof create>
const create = (wss: WebSocketHandler) => {
  const server = createServer()
  return {
    start: async () => {
      /*
       * Handle WS requests
       */
      server.on('upgrade', function upgrade (request: IncomingMessage, socket: Socket, head: Buffer): void {
        if (request.url === undefined) {
          // TODO log the error
          return socket.destroy()
        }

        const pathname = url.parse(request.url).pathname

        if (pathname && pathname.match(/\/ws\//)) {
          return wss.handleUpgrade(request, socket, head, function done (ws: WebSocket): void {
            wss.emit('connection', ws, request)
          })
        } else {
          return socket.destroy()
        }
      })

      /*
       * Handle non WS requests
       */
      server.on('request', (request, response) => {
        const pathname = url.parse(request.url).pathname

        /*
         * The health endpoint is required by the Ingress loadbalancer
         * in Google Kubernetes Engine
         */
        if (pathname === '/health') {
          return response.writeHead(200, {}).end()
        }

        return response.writeHead(500, {}).end()
      })

      server.listen({ port: 8888 })
      return new Promise((resolve) => {
        server.on('listening', resolve)
      })
    },
    stop: async () => {
      return new Promise((resolve) => {
        server.close(resolve)
      })
    }
  }
}

export default create

