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

      const newState = await loop(state, [message])

      expect(newState.players).to.not.be.empty
  })

  it('does not register player in game if duplicated id', async () => {
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

      const newState = await loop(state, [message, message])

      expect(newState.players).to.have.lengthOf(1)
  })
})
