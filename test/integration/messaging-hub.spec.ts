import { expect } from 'chai'
import WS from 'ws'
import { MessagingHub } from '../../src/messaging-hub'

function P (fn: (resolver: (value?: any | PromiseLike<void>) => void) => void): Promise<void> {
  return new Promise((resolve) => fn(resolve))
}

function sleep (ms: number = 100): Promise<void> {
  return P((resolve) => setTimeout(resolve, ms))
}

describe('Messaging Hub - Integration', () => {
  let server: WS.Server
  let client: WS
  let hub: MessagingHub

  beforeEach(async () => {
    await P((r) => server = new WS.Server({ port: 8888 }, r))

    hub = new MessagingHub(server)

    // NOTE the client has to be created after the hub is initalized
    // or otherwise the 'connection' event from the server
    // will be lost
    await P((resolve) => {
      client = new WS('ws://localhost:8888')
      client.on('open', resolve)
    })
  })

  afterEach(async () => {
    await P((resolve) => server.close(resolve))
  })

  it('receives and handles messages', async () => {
    await P((resolve) => client.send('some data', resolve))
    await sleep()

    const messages = hub.pull()

    expect(messages).to.have.lengthOf(1)
  })

  it('sends messages', async () => {
    const messages: string[] = []
    client.on('message', (message: string) => messages.push(message))
    await P((resolve) => client.send('some data', resolve))
    await sleep()

    const [{ channel: { id: channelId } }] = hub.pull()

    await hub.send({ channel: { id: channelId }, data: 'hello' })

    await sleep()

    expect(messages).to.eql(['hello'])
  })
})

