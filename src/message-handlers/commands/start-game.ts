import { StartGameMessage } from '../../messages'
import { HandlerResult } from '../'
import { GameState } from '../../game-state'

export default function handler (_message: StartGameMessage, state: GameState): HandlerResult<void> {
  if (state.started) {

    return {
      response: {
        data: {
          result: 'Failure',
          msg: 'Game has been already started' 
        },
        sys: {
          type: 'Response',
          id: 'StartGame'
        }
      },
      state
    }
  } else {
    state.started = true

    return {
      response: {
        data: {
          result: 'Success'
        },
        sys: {
          type: 'Response',
          id: 'StartGame'
        }
      },
      state}
  }
}
