import { MovePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { HandlerResult } from '../index'

type Position = { x: number, y: number }
function calculateNewPosition (movement: string, position: Position, rotation: number): Position {
  const direction = movement === 'forward' ? 1 : -1
  const speed = 1
  const magnitude = direction * speed
  const radians = (rotation * Math.PI) / 180
  const dX = magnitude * Math.cos(radians)
  const dY = magnitude * Math.sin(radians)
  // TODO round this values. How many decimal places to keep?
  const newX = dX + position.x
  const newY = dY + position.y

  return { x: newX, y: newY }
}

type PlayerPosition = {
  position: {
    x: number,
    y: number
  },
  rotation: number
}

export default function movePlayer (message: MovePlayerMessage, state: GameState): HandlerResult<PlayerPosition> {
  const [ player ] = state.players
  message.payload.data.movements.forEach((movement) => {
    if (movement.type === 'displacement') {
      player.position = calculateNewPosition(movement.direction, player.position, player.rotation)
    }

    // TODO test for degrees > 360
    if (movement.type === 'rotation') {
      player.rotation = movement.degrees
    }
  })

  return {
    response: {
      data: {
        result: 'Success',
        details: {
          position: player.position,
          rotation: player.rotation
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

