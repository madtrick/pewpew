import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, Success, Result, asSuccess } from '../../../src/components/arena'
import { createPlayer } from '../../../src/player'
import movePlayer from '../../../src/domain/move-player'
import { scan } from '../../../src/components/radar'
import { Position, Rotation } from '../../../src/types'

function makeSuccess<T> (data: T): Success<T> {
  return { ...data, status: 'ok' }
}

enum DisplacementDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward'
}

type MovementTestOptions<T, F>= {
  arena: () => Arena,
  initialRotation: Rotation,
  initialPosition: Position,
  movements: { direction: DisplacementDirection }[],
  expectedResponses: Result<T, F>[]
}
function movementTest<T, F> (options: MovementTestOptions<T, F>): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const player = createPlayer({ id: 'player-1' })
    arena.registerPlayer(player, { position: options.initialPosition })
    player.rotation = options.initialRotation

    const results = options.movements.map((movement) => {
      return asSuccess(movePlayer(movement, player, arena.players(), { width: arena.width, height: arena.height }))
    }).filter(Boolean)

    results.forEach((result, index) => expect(result).to.eql(options.expectedResponses[index]))
  }
}

describe('Domain - Move player', () => {
  let sandbox: sinon.SinonSandbox
  let arena: Arena

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    arena = new Arena({ width: 100, height: 100 }, { radar: scan })
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('moves the player - horizontally', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD },
      { direction: DisplacementDirection.BACKWARD }
    ],
    initialPosition: { x: 50, y: 50 },
    initialRotation: 0,
    arena: () => arena,
    expectedResponses: [
      makeSuccess({ position: { x: 51, y: 50 } }),
      makeSuccess({ position: { x: 50, y: 50 } })
    ]
  }))

  it('moves the player - vertically', movementTest({
    movements: [
      { direction: DisplacementDirection.BACKWARD }
    ],
    arena: () => arena,
    initialPosition: { x: 50, y: 50 },
    initialRotation: 90,
    expectedResponses: [
      makeSuccess({ position: { x: 50, y: 49 } })
    ]
  }))

  it('moves the player - at an angle', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD }
    ],
    arena: () => arena,
    initialPosition: { x: 50, y: 50 },
    initialRotation: 30,
    expectedResponses: [
      makeSuccess({ position: { x: 50.86603, y: 50.5 } })
    ]
  }))

  it('moves the player - at an angle', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD },
      { direction: DisplacementDirection.BACKWARD }
    ],
    arena: () => arena,
    initialPosition: { x: 50, y: 50 },
    initialRotation: 30,
    expectedResponses: [
      makeSuccess({ position: { x: 50.86603, y: 50.5 } }),
      makeSuccess({ position: { x: 50, y: 50 } })
    ]
  }))

  it('moves the player - if it does not collide with others', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD }
    ],
    arena: () => {
      const player = createPlayer({ id: 'player-2' })

      arena.registerPlayer(player, { position: { x: 84, y: 50 } })

      return arena
    },
    initialPosition: { x: 50, y: 50 },
    initialRotation: 0,
    expectedResponses: [
      makeSuccess({ position: { x: 51, y: 50 } })
    ]
  }))

  it('does not move the player - if it collides with others', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD }
    ],
    arena: () => {
      const player = createPlayer({ id: 'player-2' })

      // 50 + 16 = 66
      // 83 - 16 = 67
      arena.registerPlayer(player, { position: { x: 83, y: 50 } })

      return arena
    },
    initialPosition: { x: 50, y: 50 },
    initialRotation: 0,
    expectedResponses: [
      makeSuccess({ position: { x: 50, y: 50 } })
    ]
  }))
})

