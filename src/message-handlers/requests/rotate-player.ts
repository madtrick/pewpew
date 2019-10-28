import { RotatePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../index'

// TODO unifiy the PlayerPosition (or Position) in just one place
// instead of having the same structure used in different places
// with different names
export type PlayerPosition = {
  x: number,
  y: number
}

export interface RotatePlayerResultDetails {
  id: string
  rotation: number
}

export default function rotatePlayer (session: Session, message: RotatePlayerMessage, state: GameState): HandlerResult {
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
        reason: 'There is no player registered for this session'
      },
      state
    }
  }

  const player = state.arena.findPlayer(playerId)

  if (!player) {
    // TODO can I change with confidence the return type of `findPlayer` so it
    // doesn't return `undefined` and we can avoid this is
    throw new Error('This should not be possible')
  }
  const { data: { rotation } } = message
  state.arena.rotatePlayer(rotation, player)

  return {
    result: {
      success: true,
      request: RequestType.RotatePlayer,
      details: {
        id: player.id,
        rotation
      }
    },
    state
  }
}
