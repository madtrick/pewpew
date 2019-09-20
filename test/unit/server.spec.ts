import { expect } from 'chai'
import * as sinon from 'sinon'
import { EventEmitter } from 'events'
import { start as startServer, init } from '../../src/server'

describe('Server', () => {
  it('calls the engine on each tick', () => {
    let callback: Function
    const context = init({ WS: EventEmitter })
    context.ticker = { atLeastEvery: (_, fn) => { callback = fn }, cancel: sinon.stub() }
    context.engine = sinon.stub()
    context.loop = sinon.stub()
    const controlMessages = [{ channel: { id: 'ch-1' }, data: JSON.stringify({}) }]
    const playerMessages = [{ channel: { id: 'ch-2' }, data: JSON.stringify({}) }]
    context.messaging = {
      control: { pull: sinon.stub().returns(controlMessages), send: sinon.stub() },
      players: { pull: sinon.stub().returns(playerMessages), send: sinon.stub() }
    }

    startServer(context)
    callback!()

    expect(context.engine).to.have.been.calledWith(
      context.engineState,
      context.loop,
      [{ channel: { id: 'ch-1' }, data: {} }],
      [{ channel: { id: 'ch-2' }, data: {} }],
      context.createSession,
      context.createControlSession
    )
  })

  // TODO test that we are not throwing when json.parse fails
})

