import { expect } from 'chai'
import loop, { IncommingMessage, GameState } from '../../src/game-loop'



describe('Game loop', () => {
  it('registers player in game', async () => {
      const state: GameState = { players: [] }
      const message: IncommingMessage = {
        data: {
          id: 'player-1'
        },
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        }
      }

      const { responses: [ response ], state: newState } = await loop(state, [message])

      expect(newState.players).to.not.be.empty
      expect(response).to.eql({
        data: {
          result: 'Success',
        },
        sys: {
          type: 'Response',
          id: 'RegisterPlayer'
        }
      })
  })

  it('does not register player in game if duplicated id', async () => {
      const state: GameState = { players: [{ id: 'player-1' }] }
      const message: IncommingMessage = {
        data: {
          id: 'player-1'
        },
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        }
      }

      const { responses: [ response ], state: newState } = await loop(state, [message])

      expect(newState.players).to.have.lengthOf(1)
      expect(response).to.eql({
        data: {
          msg: 'Player already registered with id player-1',
          result: 'Failure'
        },
        sys: {
          type: 'Response',
          id: 'RegisterPlayer'
        }
      })
  })
})
