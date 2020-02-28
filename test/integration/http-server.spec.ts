import { expect } from 'chai'
import WebSocket from 'ws'
import { get } from 'http'
import createServer, { Server } from '../../src/http-server'

describe('HTTP Server - Integration', () => {
  let server: Server

  beforeEach(async () => {
    const wss = new WebSocket.Server({ noServer: true })
    server = createServer(wss)

    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('http upgrade requests', () => {
    describe('path prefixed with "/ws"', () => {
      it('opens the connection', (done) => {
        const ws = new WebSocket('ws://localhost:8888/ws/foo')
        ws.on('open', () => {
          ws.terminate()
          done()
        })
      })
    })

    describe('path not prefixed with "/ws"', () => {
      it('closes the socket immediately', (done) => {
        const ws = new WebSocket('ws://localhost:8888/foo/bar')
        ws.on('error', (e: Error & { code: string }) => {
          expect(e.code).to.eql('ECONNRESET')
          done()
        })
      })
    })
  })

  describe('http request', () => {
    describe('"GET" requests to "/health"', () => {
      it('return a 200', (done) => {
        get('http://localhost:8888/health', (res) => {
          expect(res.statusCode).to.eql(200)
          done()
        })
      })
    })

    describe('requests to other paths', () => {
      it('returns a 500', (done) => {
        get('http://localhost:8888/foo', (res) => {
          expect(res.statusCode).to.eql(500)
          done()
        })
      })
    })
  })
})

