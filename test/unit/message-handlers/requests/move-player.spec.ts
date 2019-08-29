import { expect } from 'chai'
import { MovePlayerMessage, Movement } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createSession } from '../../../../src/session'
import { createPlayer } from '../../../../src/player'
import { Arena } from '../../../../src/components/arena'
import { RequestType, SuccessfulMovePlayerRequest, FailureRequestResult } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/requests/move-player'

// TODO: test the representation of the player in the arena
// TODO: test with the game not started
// TODO: test with the player destroyed

type MovementTestOptions= {
  arena: () => Arena,
    player: { position: { x: number, y: number }, rotation: number },
  movement: Movement,
  expectedResult: SuccessfulMovePlayerRequest | FailureRequestResult
}

const PLAYER_ID = 'player-1'

function movementTest(options: MovementTestOptions): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const state: GameState = new GameState({ arena })
    const player = createPlayer({ id: PLAYER_ID })
    arena.registerPlayer(player, { position: options.player.position })
    player.rotation = options.player.rotation
    // const player: Player = createPlayer({ id: 'player-1' })
    // player.position = options.player.position
    // state.players = [player]
    const session = createSession()
    const message: MovePlayerMessage = {
      data: {
        movement: options.movement
      },
      sys: {
        type: 'Request',
        id: 'MovePlayer'
      }
    }

    const { result } = await handler(session, message, state)

    expect(result).to.eql(options.expectedResult)
  }
}

describe('Requests - Move player', () => {
  let arena: Arena

  beforeEach(() => {
    arena = new Arena({ width: 100, height: 100 })
  })
  describe('when the game is started', () => {
    describe('when the player is not rotated', () => {
      it('moves the player forward', movementTest({
        player: { position: { x: 50, y: 17 }, rotation: 0 },
        movement: { direction: 'forward' },
        arena: () => arena,
        expectedResult: {
          request: RequestType.MovePlayer,
          success: true,
          details: {
            id: PLAYER_ID,
            position: {
              x: 51,
              y: 17
            }
          }
        }
      }))

      it('moves the player backward', movementTest({
        player: { position: { x: 84, y: 17 }, rotation: 0 },
        movement: { direction: 'backward' },
        arena: () => arena,
        expectedResult: {
          request: RequestType.MovePlayer,
          success: true,
          details: {
            id: PLAYER_ID,
            position: {
              x: 83,
              y: 17
            }
          }
        }
      }))

      it('does not move a player already at the arena edge', movementTest({
        // At the rigth edge
        player: { position: { x: 84, y: 17 }, rotation: 0 },
        movement: { direction: 'forward' },
        arena: () => arena,
        expectedResult: {
          request: RequestType.MovePlayer,
          success: true,
          details: {
            id: PLAYER_ID,
            position: {
              x: 84,
              y: 17
            }
          }
        }
      }))
    })
  })
})

