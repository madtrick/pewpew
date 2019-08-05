import { expect } from 'chai'
import { StartGameMessage } from '../../../../src/messages'
import { createGameState, GameState } from '../../../../src/game-state'
import handler from '../../../../src/message-handlers/commands/start-game'

describe('Command - Start game', () => {
  it('succeeds', async () => {
      const state: GameState = createGameState()
      const message: StartGameMessage = {
        session: {
          uuid: 'fake-session'
        },
        payload: {
          sys: {
            type: 'Command',
            id: 'StartGame'
          }
        }
      }

      const { response, state: newState } = await handler(message, state)

      expect(response).to.eql({
        data: {
          result: 'Success'
        },
        sys: {
          type: 'Response',
          id: 'StartGame'
        }
      })
      expect(newState.started).to.be.true
  })
})

