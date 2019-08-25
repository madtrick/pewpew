import { Session } from '../session'
import { GameState } from '../game-state'
import {
  OutgoingMessage,
  RegisterPlayerMessage,
  MovePlayerMessage,
  ShootMessage,
  StartGameMessage
} from '../messages'
import StartGameHandler from './commands/start-game'
import RegisterPlayerHandler from './requests/register-player'
import MovePlayerHandler, { PlayerPosition } from './requests/move-player'
import ShootHandler from './requests/shoot'

export interface HandlerResult<T> {
  response: OutgoingMessage<T>
  state: GameState
}

export interface IncommingMessageHandlers {
  Request: {
    RegisterPlayer: (session: Session, message: RegisterPlayerMessage, state: GameState) => HandlerResult<void>
    MovePlayer: (session: Session, message: MovePlayerMessage, state: GameState) => HandlerResult<PlayerPosition>
    Shoot: (session: Session, message: ShootMessage, state: GameState) => HandlerResult<void>
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
    RegisterPlayer: RegisterPlayerHandler,
    MovePlayer: MovePlayerHandler,
    Shoot: ShootHandler
  }
}
