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
    const messages = [
      { channel: { id: 'ch-1' }, route: { id: 'control' }, data: JSON.stringify({}) },
      { channel: { id: 'ch-2' }, route: { id: 'player' }, data: JSON.stringify({}) }
    ]

    let onOpenChannel: (ch: ChannelRef) => void

    context.messagingHub = {
      pull: sinon.stub().returns(messages),
      send: sinon.stub(),
      on: ((_: string, listener: any) => onOpenChannel = listener)
    }

    startServer(context)

    // @ts-ignore: TODO remove this ignore
    onOpenChannel({ id: 'ch-1' }, { route: { id: 'control' } })
    // @ts-ignore: TODO remove this ignore
    onOpenChannel({ id: 'ch-2' }, { route: { id: 'player' } })

    // @ts-ignore: TODO remove this ignore
    await callback(currentTick)

    expect(context.engine).to.have.been.calledWith(
      context.engineState,
      context.loop,
      [{ channel: { id: 'ch-1' }, route: { id: 'control' }, data: {} }],
      [{ channel: { id: 'ch-2' }, route: { id: 'player' }, data: {} }]
    )
    expect(context.messagingHub.send).to.have.been.calledWith({
      channel: { id: 'ch-1' },
      data: JSON.stringify(responseToControl)
    })
    expect(context.messagingHub.send).to.have.been.calledWith({
      channel: { id: 'ch-2' },
      data: JSON.stringify(responseToPlayer)
    })
  })

  // TODO test that we are not throwing when json.parse fails
})

