import { expect } from 'chai'
import * as sinon from 'sinon'
import engine from '../../src/engine'

describe('Engine', () => {
  describe('on each game tick', () => {
    const gameStateFactory = sinon.stub().returns('fake-state')

    it('pulls messages from the message hub', () => {
      const messageHub = { pull: sinon.stub() }
      const loop = sinon.stub()
      const config = { loopDelayInMs: 100 }
      const clock = sinon.useFakeTimers()

      engine(loop, messageHub, gameStateFactory, config)

      clock.tick(config.loopDelayInMs)

      expect(messageHub.pull).to.have.been.calledOnce

      clock.restore()
    })

    it('calls the game loop periodically', async () => {
      const loop = sinon.stub()
      const clock = sinon.useFakeTimers()
      const config = { loopDelayInMs: 100 }
      const messageHub = { pull: sinon.stub().returns(['message-1', 'message-2']) }

      engine(loop, messageHub, gameStateFactory, config)

      // TODO add a second call
      clock.tick(config.loopDelayInMs)

      expect(loop).to.have.been.calledOnceWith('fake-state', ['message-1', 'message-2'])
      clock.restore()
    })

  })
})

