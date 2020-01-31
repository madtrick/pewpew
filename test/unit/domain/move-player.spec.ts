import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, asSuccess } from '../../../src/components/arena'
import { createPlayer, Player } from '../../../src/player'
import movePlayer from '../../../src/domain/move-player'
import { scan } from '../../../src/components/radar'
import { Position, Rotation } from '../../../src/types'
import { config } from '../../config'

const { turboMultiplierFactor, costs, movementSpeeds } = config
const playerSpeed = movementSpeeds.player
const turboCostInTokens = costs.playerMovementTurbo
enum DisplacementDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward'
}

type MovementTestOptions = {
  arena: () => Arena,
  initialRotation: Rotation,
  initialPosition: Position,
  movements: { direction: DisplacementDirection, withTurbo?: boolean }[],
  expectedResponses: { position: Position }[]
}
function movementTest (options: MovementTestOptions): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
    const registeredPlayer = asSuccess(arena.registerPlayer(player, { position: options.initialPosition })).player
    registeredPlayer.rotation = options.initialRotation

    const results = options.movements.map((movement) => {

      return asSuccess(
        movePlayer(
          movement,
          playerSpeed,
          turboCostInTokens,
          turboMultiplierFactor,
          registeredPlayer,
          arena.players(),
          { width: arena.width, height: arena.height }
        )
      ).player.position
    }).filter(Boolean)

    results.forEach((position, index) => expect(position).to.eql(options.expectedResponses[index].position))
  }
}

describe('Domain - Move player', () => {
  let sandbox: sinon.SinonSandbox
  let arena: Arena
  let player: Player

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    arena = new Arena({ width: 100, height: 100 }, { radar: scan })
    player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when the turbo is not requested', () => {
    it('consumes no tokens', () => {
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      registeredPlayer.rotation = 0
      const initialPlayerTokens = registeredPlayer.tokens

      const result = asSuccess(
        movePlayer(
          { direction: DisplacementDirection.FORWARD, withTurbo: false },
          playerSpeed,
          turboCostInTokens,
          turboMultiplierFactor,
          registeredPlayer,
          arena.players(),
          { width: arena.width, height: arena.height }
        )
      )

      expect(result.player.position).to.eql({ x: 51, y: 50 })
      expect(result.turboApplied).to.eql(false)
      expect(result.actionCostInTokens).to.eql(0)
      expect(result.player.tokens).to.eql(initialPlayerTokens)
    })
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
      { position: { x: 51, y: 50 } },
      { position: { x: 50, y: 50 } }
    ]
  }))

  describe('when the turbo is requested', () => {
    describe('when the player has enough tokens to use the turbo', () => {
      it('moves the player - horizontally', () => {
        const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
        registeredPlayer.rotation = 0
        const initialPlayerTokens = registeredPlayer.tokens

        const result = asSuccess(
          movePlayer(
            { direction: DisplacementDirection.FORWARD, withTurbo: true },
            playerSpeed,
            turboCostInTokens,
            turboMultiplierFactor,
            registeredPlayer,
            arena.players(),
            { width: arena.width, height: arena.height }
          )
        )

        expect(result.player.position).to.eql({ x: 52, y: 50 })
        expect(result.turboApplied).to.eql(true)
        expect(result.actionCostInTokens).to.eql(turboCostInTokens)
        expect(result.player.tokens).to.eql(initialPlayerTokens - turboCostInTokens)
      })
    })

    describe('when the player does not have enough tokens to use the turbo', () => {
      it('moves the player - horizontally', () => {
        const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
        registeredPlayer.rotation = 0
        registeredPlayer.tokens = 0

        const result = asSuccess(
          movePlayer(
            { direction: DisplacementDirection.FORWARD, withTurbo: true },
            playerSpeed,
            turboCostInTokens,
            turboMultiplierFactor,
            player,
            arena.players(),
            { width: arena.width, height: arena.height }
          )
        )

        expect(result.player.position).to.eql({ x: 51, y: 50 })
        expect(result.turboApplied).to.eql(false)
        expect(result.actionCostInTokens).to.eql(0)
        expect(result.player.tokens).to.eql(0)
        expect(result.errors).to.eql([
          {
            msg: 'The player does not have enough tokens to use the turbo'
          }
        ])
      })
    })
  })

  it('moves the player - vertically', movementTest({
    movements: [
      { direction: DisplacementDirection.BACKWARD }
    ],
    arena: () => arena,
    initialPosition: { x: 50, y: 50 },
    initialRotation: 90,
    expectedResponses: [
      { position: { x: 50, y: 49 } }
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
      { position: { x: 50.86603, y: 50.5 } }
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
      { position: { x: 50.86603, y: 50.5 } },
      { position: { x: 50, y: 50 } }
    ]
  }))

  it('moves the player - if it does not collide with others', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD }
    ],
    arena: () => {
      const player = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })

      arena.registerPlayer(player, { position: { x: 84, y: 50 } })

      return arena
    },
    initialPosition: { x: 50, y: 50 },
    initialRotation: 0,
    expectedResponses: [
      { position: { x: 51, y: 50 } }
    ]
  }))

  it('does not move the player - if it collides with others', movementTest({
    movements: [
      { direction: DisplacementDirection.FORWARD }
    ],
    arena: () => {
      const player = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })

      // 50 + 16 = 66
      // 83 - 16 = 67
      arena.registerPlayer(player, { position: { x: 83, y: 50 } })

      return arena
    },
    initialPosition: { x: 50, y: 50 },
    initialRotation: 0,
    expectedResponses: [
      { position: { x: 50, y: 50 } }
    ]
  }))
})

