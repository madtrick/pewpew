import { Movement } from '../messages'
import { Player, PLAYER_RADIUS } from '../player'
import { Position } from '../types'
import { round } from '../helpers'
import { Result, ArenaPlayer } from '../components/arena'

const MOVEMENT_SPEED = process.env.MOVEMENT_SPEED ? Number(process.env.MOVEMENT_SPEED) : 1

function calculateNewPlayerPosition (movement: Movement, player: Player, currentPosition: Position): Position {
  const direction = movement.direction === 'forward' ? 1 : -1
  // TODO read the movement speed from the configuration
  const magnitude = direction * MOVEMENT_SPEED
  const radians = (player.rotation * Math.PI) / 180
  const dX = magnitude * Math.cos(radians)
  const dY = magnitude * Math.sin(radians)
  const newX = round(dX + currentPosition.x)
  const newY = round(dY + currentPosition.y)

  return { x: newX, y: newY }
}

function isPlayerPositionWithinBoundaries ({ x, y }: Position, arenaDimensions: { width: number, height: number }): boolean {
  return ((x + PLAYER_RADIUS) <= arenaDimensions.width) &&
    ((y + PLAYER_RADIUS) <= arenaDimensions.height) &&
    ((x - PLAYER_RADIUS) >= 0) &&
    ((y - PLAYER_RADIUS) >= 0)
}

// TODO create a type for all domain functions. Something like:
// Domain<State, Action>
export type MovePlayer = typeof movePlayer
export default function movePlayer (
  movement: Movement,
  player: Player,
  players: ArenaPlayer[],
  arenaDimensions: { width: number, height: number }
): Result<{ position: Position }, null> {
  const arenaPlayer = players.find((arenaPlayer) => arenaPlayer.id === player.id)
  // TODO throw if the player hasn't been found
  const newPosition = calculateNewPlayerPosition(movement, player, arenaPlayer!.position)

  const { x, y } = newPosition
  const collides = players.find((arenaPlayer) => {
    if (arenaPlayer.id === player.id) {
      return false
    }

    /*
     * Formula got at http://stackoverflow.com/a/8367547/1078859
     * (R0-R1)^2 <= (x0-x1)^2+(y0-y1)^2 <= (R0+R1)^2
     */

    const { x: ox, y: oy } = arenaPlayer.position
    const value = Math.pow((x - ox), 2) + Math.pow((y - oy), 2)
    // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
    // but will it keep it here in case we have players with different radius

    return Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) <= value && value <= Math.pow(PLAYER_RADIUS + PLAYER_RADIUS, 2)
  })

  if (isPlayerPositionWithinBoundaries(newPosition, arenaDimensions) && collides === undefined) {
    arenaPlayer!.position = newPosition

    return {
      status: 'ok',
      position: newPosition
    }
  } else {
    return {
      status: 'ok',
      position: arenaPlayer!.position
    }
  }
}

