import { expect } from 'chai'
import { RegisterPlayerMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer } from '../../../../src/player'
import { Arena } from '../../../../src/components/arena'
import handler from '../../../../src/message-handlers/requests/register-player'

describe('Requests - Register player', () => {
  const arena = new Arena({ width: 100, height: 100 })
  const gameStateOptions = { arena }

  describe('when the game has not started', () => {
    it('registers player in game', () => {
      const state: GameState = new GameState(gameStateOptions)
      const message: RegisterPlayerMessage = {
        session: {
          uuid: 'fake-session'
        },
        payload: {
          data: {
            id: 'player-1'
          },
          sys: {
            type: 'Request',
            id: 'RegisterPlayer'
          }
        }
      }

      const { response, state: newState } = handler(message, state)

      expect(newState.players()).to.have.lengthOf(1)
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

    it('does not register player in game if duplicated id', () => {
      const player = createPlayer({ id: 'player-1'})
      const state: GameState = new GameState(gameStateOptions)
      state.registerPlayer(player)
      const message: RegisterPlayerMessage = {
        session: {
          uuid: 'fake-session'
        },
        payload: {
          data: {
            id: 'player-1'
          },
          sys: {
            type: 'Request',
            id: 'RegisterPlayer'
          }
        }
      }

      const { response, state: newState } = handler(message, state)

      expect(newState.players()).to.have.lengthOf(1)
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
})

