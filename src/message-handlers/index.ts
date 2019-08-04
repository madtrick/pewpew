import { GameState } from '../game-state'
import { OutgoingMessage, RegisterPlayerMessage, StartGameMessage } from '../messages'
import StartGameHandler from './commands/start-game'
import RegisterPlayerHandler from './requests/register-player'

export interface HandlerResult<T> {
  response: OutgoingMessage<T>
  state: GameState
}

export interface IncommingMessageHandlers {
  Request: {
    RegisterPlayer: (message: RegisterPlayerMessage, state: GameState) => HandlerResult<void>
  },
  Command: {
    StartGame: (message: StartGameMessage, state: GameState) => HandlerResult<void>
  }
}


export const handlers: IncommingMessageHandlers = {
  Command: {
    StartGame: StartGameHandler
  },
  Request: {
    RegisterPlayer: RegisterPlayerHandler
  }
}
