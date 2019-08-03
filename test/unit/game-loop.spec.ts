import { expect } from 'chai'
import { RegisterPlayerMessage } from '../../src/messages'
import { GameState } from '../../src/game-state'
import { handlers } from '../../src/message-handlers'
import createGameLopp from '../../src/game-loop'

describe('Game loop', () => {
  const loop = createGameLopp(handlers)

  it('registers player in game', async () => {
      const state: GameState = { players: [], started: false }
      const message: RegisterPlayerMessage = {
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
      const state: GameState = { players: [{ id: 'player-1' }], started: false }
      const message: RegisterPlayerMessage = {
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
