import { GameState } from '../../game-state'
import { HandlerResult, RequestType } from '../../message-handlers'
import { RegisterPlayerMessage } from '../../messages'
import { createPlayer } from '../../player'
import { Session } from '../../session'
import { Position } from '../../types'

export interface RegisterPlayerResultDetails {
  id: string
  position: Position
  rotation: number
  isGameStarted: boolean
}

export default function registerPlayer (session: Session, message: RegisterPlayerMessage, state: GameState): HandlerResult {
  const player = createPlayer(message.data)
  // TODO, maybe check if session.player is already set and reject
  const result = state.registerPlayer(player)

  // TODO reject players registering in the game if the game already started?
  // TODO another reason for KO could be too many players in the arena
  if (result.status === 'ko') {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RegisterPlayer,
        reason: `Player already registered with id ${message.data.id}`,
      },
      state
    }
  }

  session.playerId = result.player.id

  // TODO include the initial life in the response
  return {
    result: {
      success: true,
      request: RequestType.RegisterPlayer,
      details: {
        id: result.player.id,
        position: result.player.position,
        rotation: result.player.rotation,
        isGameStarted: state.started
      }
    },
    state
  }
}
