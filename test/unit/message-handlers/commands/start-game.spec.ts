import { expect } from 'chai'
import { StartGameMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { Arena } from '../../../../src/components/arena'
import handler from '../../../../src/message-handlers/commands/start-game'

describe('Command - Start game', () => {
  const arena = new Arena({ width: 100, height: 100 })

  it('succeeds', async () => {
      const state: GameState = new GameState({ arena })
      const message: StartGameMessage = {
        sys: {
          type: 'Command',
          id: 'StartGame'
        }
      }

      // TODO, update this to also take a session object
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

