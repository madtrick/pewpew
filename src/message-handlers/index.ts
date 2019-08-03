import { GameState } from '../game-state'
import { OutgoingMessage, RegisterPlayerMessage, StartGameMessage } from '../messages'
import StartGameHandler from './commands/start-game'
import RegisterPlayerHandler from './requests/register-player'

export interface HandlerResult {
  response: OutgoingMessage
  state: GameState
}

export interface IncommingMessageHandlers {
  Request: {
    RegisterPlayer: (message: RegisterPlayerMessage, state: GameState) => HandlerResult
  },
  Command: {
    StartGame: (message: StartGameMessage, state: GameState) => HandlerResult
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
