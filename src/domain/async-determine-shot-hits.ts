import { ArenaShot, ArenaPlayer } from '../components/arena'
import { SHOT_RADIUS } from '../shot'
import { PLAYER_RADIUS } from '../player'

type ArenaDimensions = { width: number, height: number }

export function shotHisWalls (shot: ArenaShot, { width, height }: ArenaDimensions): boolean {
  const { x, y } = shot.position

  return ((x + SHOT_RADIUS) >= width) ||
    ((y + SHOT_RADIUS) >= height) ||
    ((x - SHOT_RADIUS) <= 0) ||
    ((y - SHOT_RADIUS) <= 0)
}

export function shotHitsPlayer (shot: ArenaShot, player: ArenaPlayer): boolean {
  const { x: shotX, y: shotY } = shot.position
  // Formula got at http://stackoverflow.com/a/8367547/1078859
  // (R0-R1)^2 <= (x0-x1)^2+(y0-y1)^2 <= (R0+R1)^2

  if (player.id === shot.player.id) {
    // Self harm is not possible
    return false
  }

  const { x: ox, y: oy } = player.position
  const value = Math.pow((shotX - ox), 2) + Math.pow((shotY - oy), 2)

  const circleIntersect = Math.pow(SHOT_RADIUS - PLAYER_RADIUS, 2) <= value && value <= Math.pow(SHOT_RADIUS + PLAYER_RADIUS, 2)
  // Check if the shot is inside the player https://stackoverflow.com/a/33490701
  const shotInsidePlayer = PLAYER_RADIUS > (Math.sqrt(value) + SHOT_RADIUS)

  return circleIntersect || shotInsidePlayer
}
