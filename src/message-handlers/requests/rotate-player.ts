import { RotatePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../index'
import Config from '../../config'

export const ROTATION_COST_IN_TOKENS = 0
// TODO unifiy the PlayerPosition (or Position) in just one place
// instead of having the same structure used in different places
// with different names
export type PlayerPosition = {
  x: number
  y: number
}

export interface RotatePlayerResultDetails {
  id: string
  rotation: number
  remainingTokens: number
  requestCostInTokens: number
}

export default function rotatePlayer (session: Session, message: RotatePlayerMessage, state: GameState, _config: Config): HandlerResult {
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RotatePlayer,
        reason: 'The game has not started'
      },
      state
    }
  }

  const { playerId } = session

  if (!playerId) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RotatePlayer,
        // TODO mentioning "session" in this error message is a leaking detail
        reason: 'There is no player registered for this session'
      },
      state
    }
  }

  const player = state.arena.findPlayer(playerId)

  if (!player) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RotatePlayer,
        reason: 'The player could not be found'
      },
      state
    }
  }

  const { data: { rotation } } = message
  // TODO handle the returned result. Return an error if the status is 'ko'
  state.arena.rotatePlayer(rotation, player)

  return {
    result: {
      session,
      success: true,
      request: RequestType.RotatePlayer,
      details: {
        id: player.id,
        rotation,
        remainingTokens: player.tokens,
        requestCostInTokens: ROTATION_COST_IN_TOKENS
      }
    },
    state
  }
}
