import { Movement } from '../messages'
import { Player, PLAYER_RADIUS } from '../player'
import { Position } from '../types'
import { round } from '../helpers'
import { Result, ArenaPlayer } from '../components/arena'

interface ActionResult {
  player: ArenaPlayer
  turboApplied: boolean
  actionCostInTokens: number
  errors: { msg: string }[]
}

function calculateNewPlayerPosition (movement: Movement, movementSpeed: number, player: Player, currentPosition: Position): Position {
  const direction = movement.direction === 'forward' ? 1 : -1
  // TODO read the movement speed from the configuration
  const magnitude = direction * movementSpeed
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
  speed: number,
  movePlayerCostInTokens: number,
  turboCostInTokens: number,
  turboMultiplierFactor: number,
  player: Player,
  players: ArenaPlayer[],
  arenaDimensions: { width: number, height: number }
): Result<ActionResult, null> {
  const arenaPlayer = players.find((arenaPlayer) => arenaPlayer.id === player.id)
  // TODO return a failure in the result if the player hasn't been found

  let speedWithTurbo
  let errors: { msg: string }[] = []
  let turboApplied: boolean = false

  if (movement.withTurbo) {
    if (arenaPlayer!.tokens >= turboCostInTokens) {
      turboApplied = true
      speedWithTurbo = speed * turboMultiplierFactor
      arenaPlayer!.tokens = arenaPlayer!.tokens - turboCostInTokens
    } else {
      errors.push({ msg: 'The player does not have enough tokens to use the turbo' })
      speedWithTurbo = speed
    }
  } else {
    speedWithTurbo = speed
  }

  const newPosition = calculateNewPlayerPosition(movement, speedWithTurbo, player, arenaPlayer!.position)

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

  const actionCostInTokens = (turboApplied ? turboCostInTokens : 0) + movePlayerCostInTokens

  if (isPlayerPositionWithinBoundaries(newPosition, arenaDimensions) && collides === undefined) {
    arenaPlayer!.position = newPosition

    return {
      status: 'ok',
      player: arenaPlayer!,
      turboApplied,
      actionCostInTokens,
      errors: errors
    }
  } else {
    return {
      status: 'ok',
      player: arenaPlayer!,
      turboApplied,
      actionCostInTokens,
      errors: errors
    }
  }
}

