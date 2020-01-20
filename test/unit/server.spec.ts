import { expect } from 'chai'
import * as sinon from 'sinon'
import { EventEmitter } from 'events'
import { ChannelRef } from '../../src/messaging-hub'
import { start as startServer, init } from '../../src/server'
import { config } from '../config'

describe('Server', () => {
  it('calls the engine on each tick', async () => {
    let callback: Function
    const context = init({ WS: EventEmitter }, config)
    const currentTick = 1
    context.ticker = {
      atLeastEvery: (_, fn) => callback = fn,
      cancel: sinon.stub()
    }

    const responseToPlayer = { a: 1 }
    const responseToControl = { b: 2 }
    context.engine = sinon.stub().returns({
      playerResultMessages: [{ channel: { id: 'ch-2' }, data: responseToPlayer }],
      controlResultMessages: [{ channel: { id: 'ch-1' }, data: responseToControl }]
    })
    context.loop = sinon.stub()
    const controlMessages = [{ channel: { id: 'ch-1' }, data: JSON.stringify({}) }]
    const playerMessages = [{ channel: { id: 'ch-2' }, data: JSON.stringify({}) }]

    let onOpenControlChannel: (ch: ChannelRef) => void
    let onOpenPlayerChannel: (ch: ChannelRef) => void

    context.messaging = {
      control: {
        pull: sinon.stub().returns(controlMessages),
        send: sinon.stub(),
        on: ((_: string, listener: any) => onOpenControlChannel = listener)
      },
      players: {
        pull: sinon.stub().returns(playerMessages),
        send: sinon.stub(),
        on: ((_: string, listener: any) => onOpenPlayerChannel = listener)
      }
    }

    startServer(context)

    // @ts-ignore: TODO remove this ignore
    onOpenControlChannel({ id: 'ch-1' })
    // @ts-ignore: TODO remove this ignore
    onOpenPlayerChannel({ id: 'ch-2' })

    // @ts-ignore: TODO remove this ignore
    await callback(currentTick)

    expect(context.engine).to.have.been.calledWith(
      currentTick,
      context.engineState,
      context.loop,
      [{ channel: { id: 'ch-1' }, data: {} }],
      [{ channel: { id: 'ch-2' }, data: {} }]
    )
    expect(context.messaging.control.send).to.have.been.calledWith({
      channel: { id: 'ch-1' },
      data: JSON.stringify(responseToControl)
    })
    expect(context.messaging.players.send).to.have.been.calledWith({
      channel: { id: 'ch-2' },
      data: JSON.stringify(responseToPlayer)
    })
  })

  // TODO test that we are not throwing when json.parse fails
})

