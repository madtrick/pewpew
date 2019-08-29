import { StartGameMessage } from '../../messages'
import { CommandHandlerResult, CommandType } from '../'
import { GameState } from '../../game-state'

export default function handler (_message: StartGameMessage, state: GameState): CommandHandlerResult {
  if (state.started) {

    return {
      result: {
        success: false,
        reason: 'Game has been already started',
        command: CommandType.StartGame
      },
      state
    }
  } else {
    state.started = true

    return {
      result: {
        success: true,
        command: CommandType.StartGame
      },
      state}
  }
}
