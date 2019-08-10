import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, Success, Result } from '../../../src/components/arena'
import { Player, createPlayer } from '../../../src/player'

function asSuccess<T, F>(result: Result<T, F>): Success<T> | never {
  if (result.status === 'ok') {
    return result
  }

  throw new Error('Expected a Success got a Failure')
}

describe('Arena', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('registerPlayer', () => {
    let player: Player
    let arena: Arena

    beforeEach(() => {
      player = createPlayer({ id: 'player-1' })
      arena = new Arena({ width: 100, height: 100 })
    })

    describe('avoids positions on the arena edges', () => {
      it('for random value 1 for "x"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(1)
        randomStub.onCall(1).returns(0.5)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.position
        expect(x).to.eql(84)
        expect(y).to.eql(50)
      })

      it('for random value 0 for "x"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0)
        randomStub.onCall(1).returns(0.5)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.position
        expect(x).to.eql(16)
        expect(y).to.eql(50)
      })

      it('for random value 1 for "y"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0.50)
        randomStub.onCall(1).returns(1)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.position
        expect(x).to.eql(50)
        expect(y).to.eql(84)
      })

      it('for random value 0 for "y"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0.50)
        randomStub.onCall(1).returns(0)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.position
        expect(x).to.eql(50)
        expect(y).to.eql(16)
      })
    })
  })
})

