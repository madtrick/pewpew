import { expect } from 'chai'
import { MovePlayerMessage } from '../../../../src/messages'
import { createGameState, GameState } from '../../../../src/game-state'
import { Player } from '../../../../src/player'
import handler from '../../../../src/message-handlers/requests/move-player'

describe('Requests - Move player', () => {
  describe('when the game is started', () => {
    it('succeeds', async () => {
      const state: GameState = createGameState()
      state.started = true
      const player: Player = {
        id: 'player-1',
        position: {
          x: 0,
          y: 0
        },
        rotation: 0
      }
      state.players = [player]
      const message: MovePlayerMessage = {
        session: {
          uuid: 'fake-session'
        },
        payload: {
          data: {
            movements: [{ type: 'displacement', direction: 'forward' }]
          },
          sys: {
            type: 'Request',
            id: 'MovePlayer'
          }
        }
      }

      const { response } = await handler(message, state)

      expect(response).to.eql({
        data: {
          result: 'Success',
          details: {
            position: {
              x: 1,
              y: 0
            },
            rotation: 0
          }
        },
        sys: {
          type: 'Response',
          id: 'MovePlayer'
        }
      })
      // TODO: test the representation of the player in the arena
    })

  })
})


