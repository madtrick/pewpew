import { MovePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult } from '../index'

// TODO unifiy the PlayerPosition (or Position) in just one place
// instead of having the same structure used in different places
// with different names
export type PlayerPosition = {
  position: {
    x: number,
    y: number
  }
}

export default function movePlayer (_session: Session, message: MovePlayerMessage, state: GameState): HandlerResult<PlayerPosition> {
  // TODO fetch the player from the session
  const [ player ] = state.players()
  const movement = message.data.movement
  const result = state.arena.movePlayer(movement, player)

  return {
    response: {
      data: {
        result: 'Success',
        details: {
          position: result.position
        }
      },
      sys: {
        type: 'Response',
        id: 'MovePlayer'
      }
    },
    state
  }
}

