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

function makeSuccess<T>(data: T): Success<T> {
  return { ...data, status: 'ok' }
}

enum DisplacementDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward'
}

type MovementTestOptions<T, F>= {
  arena: () => Arena,
  initialPosition: { x: number, y: number },
  // TODO temporary type while I don't figure out if
  // rotations are also considered a Movement or something else
  movements: ({ type: 'displacement', direction: DisplacementDirection } | { type: 'rotation', degrees: number })[],
  expectedResponses: Result<T, F>[]
}
function movementTest<T, F>(options: MovementTestOptions<T, F>): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const player = createPlayer({ id: 'player-1' })
    arena.registerPlayer(player)
    arena.placePlayer(options.initialPosition, player)
    player.rotation = 0

    const results = options.movements.map((movement) => {
      if (movement.type === 'rotation') {
        player.rotation = movement.degrees
        return
      }

      return asSuccess(arena.movePlayer(movement, player))
    }).filter(Boolean)

    results.forEach((result, index) => expect(result).to.eql(options.expectedResponses[index]))
  }
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

  describe('movePlayer', () => {
    let arena: Arena

    beforeEach(() => {
      arena = new Arena({ width: 100, height: 100 })
    })

    it('moves the player - horizontally', movementTest({
      movements: [
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }
      ],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 51, y: 50 } }),
        makeSuccess({ position: { x: 50, y: 50 } })
      ]
    }))

    it('moves the player - vertically', movementTest({
      movements: [
        { type: 'rotation', degrees: 90 },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50, y: 49 } })
      ]
    }))

    it('moves the player - at an angle', movementTest({
      movements: [
        { type: 'rotation', degrees: 30 },
        { type: 'displacement', direction: DisplacementDirection.FORWARD }],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50.86603, y: 50.5 } })
      ]
    }))

    it('moves the player - at an angle', movementTest({
      movements: [
        { type: 'rotation', degrees: 30 },
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }
      ],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50.86603, y: 50.5 } }),
        makeSuccess({ position: { x: 50, y: 50 } })
      ]
    }))
  })
})

