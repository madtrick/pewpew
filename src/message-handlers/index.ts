import { Session } from '../session'
import { GameState } from '../game-state'
import {
  RegisterPlayerMessage,
  MovePlayerMessage,
  RotatePlayerMessage,
  ShootMessage,
  StartGameMessage,
  DeployMineMessage
} from '../messages'
import StartGameHandler from './commands/start-game'
import RegisterPlayerHandler, { RegisterPlayerResultDetails } from './requests/register-player'
import { MovePlayer } from '../domain/move-player'
import MovePlayerHandler, { MovePlayerResultDetails } from './requests/move-player'
import ShootHandler, { ShootPlayerResultDetails } from './requests/shoot'
import RotatePlayerHandler, { RotatePlayerResultDetails } from './requests/rotate-player'
import DeployMineHandler, { DeployMineResultDetails } from './requests/deploy-mine'


export enum RequestType {
  RegisterPlayer = 'RegisterPlayer',
  MovePlayer = 'MovePlayer',
  Shoot = 'Shoot',
  RotatePlayer = 'RotatePlayer',
  DeployMine = 'DeployMine'
}

export enum CommandType {
  StartGame = 'StartGame'
}

interface CommandResult {
  success: boolean
  command: CommandType
}

export type SuccessCommandResult = CommandResult & {
  success: true
}

export type FailureCommandResult = CommandResult & {
  success: false,
  reason: string
}

interface RequestResult {
  success: boolean
  request: RequestType
}

type SuccessfulRequest = { success: true }

type SuccessfulRegiserPlayerRequest = RequestResult & SuccessfulRequest & {
  request: RequestType.RegisterPlayer
  details: RegisterPlayerResultDetails
}

export type SuccessfulMovePlayerRequest = RequestResult & SuccessfulRequest & {
  request: RequestType.MovePlayer
  details: MovePlayerResultDetails
}

export type SuccessfulShootRequest = RequestResult & SuccessfulRequest & {
  request: RequestType.Shoot
  details: ShootPlayerResultDetails
}

export type SuccessfulRotateRequest = RequestResult & SuccessfulRequest & {
  request: RequestType.RotatePlayer
  details: RotatePlayerResultDetails
}

export type SuccessfulDeployMineRequest = RequestResult & SuccessfulRequest & {
  request: RequestType.DeployMine,
  details: DeployMineResultDetails
}

export type SuccessRequestResult = SuccessfulRegiserPlayerRequest | SuccessfulMovePlayerRequest | SuccessfulShootRequest | SuccessfulRotateRequest | SuccessfulDeployMineRequest
export type FailureRequestResult = RequestResult & {
  success: false,
  reason: string
}

// TODO maybe the FailureRequestResult should have the session
// TODO do we need the session in all responses or only when we fail to register a player
export type FailureRegisterPlayerRequest = FailureRequestResult & {
  session: Session // we need the session to be able to respond to the request
}

export type FailureShootRequest = FailureRequestResult & {
  session: Session // we need the session to be able to respond to the request
}

export type FailureMoveRequest = FailureRequestResult & {
  session: Session // we need the session to be able to respond to the request
}

export type FailureRotatePlayerRequest = FailureRequestResult & {
  session: Session // we need the session to be able to respond to the request
}

export type FailureDeployMineRequest = FailureRequestResult & {
  session: Session
}

export interface CommandHandlerResult {
  result: SuccessCommandResult | FailureCommandResult
  state: GameState
}

export interface HandlerResult {
  result: SuccessRequestResult | FailureRequestResult | FailureRegisterPlayerRequest
  state: GameState
}

export interface IncommingMessageHandlers {
  Request: {
    RegisterPlayer: (session: Session, message: RegisterPlayerMessage, state: GameState) => HandlerResult
    MovePlayer: (session: Session, message: MovePlayerMessage, state: GameState, domain: MovePlayer) => HandlerResult
    RotatePlayer: (session: Session, message: RotatePlayerMessage, state: GameState) => HandlerResult
    Shoot: (session: Session, message: ShootMessage, state: GameState) => HandlerResult
    DeployMine: (session: Session, message: DeployMineMessage, state: GameState) => HandlerResult
  },
  Command: {
    StartGame: (message: StartGameMessage, state: GameState) => CommandHandlerResult
  }
}


export const handlers: IncommingMessageHandlers = {
  Command: {
    StartGame: StartGameHandler
  },
  Request: {
    RegisterPlayer: RegisterPlayerHandler,
    MovePlayer: MovePlayerHandler,
    RotatePlayer: RotatePlayerHandler,
    Shoot: ShootHandler,
    DeployMine: DeployMineHandler
  }
}
