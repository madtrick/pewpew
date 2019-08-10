import { MovePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { HandlerResult } from '../index'

type PlayerPosition = {
  position: {
    x: number,
    y: number
  }
}

// TODO validate that the player is registered
// TODO validate that the movement is valid

export default function movePlayer (message: MovePlayerMessage, state: GameState): HandlerResult<PlayerPosition> {
  const [ player ] = state.players()
  const movement = message.payload.data.movement
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

