import { expect } from 'chai'
import { StartGameMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { Arena } from '../../../../src/components/arena'
import { CommandType } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/commands/start-game'

describe('Command - Start game', () => {
  const arena = new Arena({ width: 100, height: 100 })

  it('succeeds', () => {
    const state: GameState = new GameState({ arena })
    const message: StartGameMessage = {
      type: 'Command',
      id: 'StartGame'
    }

    // TODO, update this to also take a session object
    const { result, state: newState } = handler(message, state)

    expect(result).to.eql({
      success: true,
      command: CommandType.StartGame
    })
    expect(newState.started).to.be.true
  })
})

