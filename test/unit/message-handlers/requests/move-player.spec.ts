import { expect } from 'chai'
import { MovePlayerMessage, Movement, OutgoingMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer } from '../../../../src/player'
import { Arena } from '../../../../src/components/arena'
import handler from '../../../../src/message-handlers/requests/move-player'

// TODO: test the representation of the player in the arena
// TODO: test with the game not started
// TODO: test with the player destroyed

type MovementTestOptions<T>= {
  arena: () => Arena,
    player: { position: { x: number, y: number }, rotation: number },
  movement: Movement,
  expectedResponse: OutgoingMessage<T>
}
function movementTest<T>(options: MovementTestOptions<T>): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const state: GameState = new GameState({ arena })
    const player = createPlayer({ id: 'player-1' })
    arena.registerPlayer(player, { position: options.player.position })
    player.rotation = options.player.rotation
    // const player: Player = createPlayer({ id: 'player-1' })
    // player.position = options.player.position
    // state.players = [player]
    const message: MovePlayerMessage = {
      session: {
        uuid: 'fake-session'
      },
      payload: {
        data: {
          movement: options.movement
        },
        sys: {
          type: 'Request',
          id: 'MovePlayer'
        }
      }
    }

    const { response } = await handler(message, state)

    expect(response).to.eql(options.expectedResponse)
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
          expectedResponse: {
          data: {
            result: 'Success',
            details: {
              position: {
                x: 51,
                y: 17
              }
            }
          },
          sys: {
            type: 'Response',
            id: 'MovePlayer'
          }
        }
      }))

      it('moves the player backward', movementTest({
        player: { position: { x: 84, y: 17 }, rotation: 0 },
        movement: { direction: 'backward' },
        arena: () => arena,
          expectedResponse: {
          data: {
            result: 'Success',
            details: {
              position: {
                x: 83,
                y: 17
              }
            }
          },
          sys: {
            type: 'Response',
            id: 'MovePlayer'
          }
        }
      }))

      it('does not move a player already at the arena edge', movementTest({
        // At the rigth edge
        player: { position: { x: 84, y: 17 }, rotation: 0 },
        movement: { direction: 'forward' },
        arena: () => arena,
          expectedResponse: {
          data: {
            result: 'Success',
            details: {
              position: {
                x: 84,
                y: 17
              }
            }
          },
          sys: {
            type: 'Response',
            id: 'MovePlayer'
          }
        }
      }))
    })
  })
})

