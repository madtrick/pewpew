import { expect } from 'chai'
import createServer, { Server } from '../../src/http-server'
import WebSocket from 'ws'
import { init, start, stop, Server as GameServer } from '../../src/server'
import { config } from '../config'
import VERSION from '../../src/version'

describe('End to end', () => {
  let httpServer: Server
  let gameServer: GameServer

  beforeEach(async () => {
    const websocketHandler = new WebSocket.Server({ noServer: true })
    const context = init({ WS: websocketHandler }, config)
    httpServer = createServer(websocketHandler)

    gameServer = start(context)
    await httpServer.start()
  })

  afterEach(async () => {
    await httpServer.stop()
    await stop(gameServer)
  })

  describe('under normal circumstances', () => {
    it('responds to player\'s messages', (done) => {
      const websocket = new WebSocket('ws://localhost:8888/ws/player')
      const message = JSON.stringify({
        type: 'Request',
        id: 'RegisterPlayer',
        data: {
          game: {
            version: VERSION
          },
          id: 'player-1'
        }
      })

      websocket.on('open', () => {
        websocket.on('message', (reply) => {
          const parsed = JSON.parse(reply.toString())

          if (parsed.type === 'Notification' && parsed.id === 'Tick') {
            // ignore tick notifications
            return
          }

          expect(parsed).to.include({
            type: 'Response',
            id: 'RegisterPlayer'
          })

          /* Close the websocket to let the http server
           * close immediately. Otherwise after calling
           * httpServer.close it will still wait until
           * all the open sockets are closed
           */
          websocket.close()
          done()
        })
        websocket.send(message)
      })
    })
  })
})
