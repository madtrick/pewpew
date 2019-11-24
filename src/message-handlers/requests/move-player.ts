import { MovePlayerMessage } from '../../messages'
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

export interface MovePlayerResultDetails {
  id: string
  position: PlayerPosition
}

export default function movePlayer (session: Session, message: MovePlayerMessage, state: GameState): HandlerResult {
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.MovePlayer,
        reason: 'The game has not started'
      },
      state
    }
  }

  const player = state.players().find((player) => player.id === session.playerId)

  if (!player) {
    // TODO should we instead return a message with result === false
    // When can this be the case? That is, that the player is not in the arena?
    throw new Error('Player not found')
  }

  const movement = message.data.movement
  const result = state.arena.movePlayer(movement, player)

  return {
    result: {
      success: true,
      request: RequestType.MovePlayer,
      details: {
        id: player.id,
        position: result.position
      }
    },
    state
  }
}

