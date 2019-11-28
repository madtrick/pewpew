import { ArenaShot } from '../components/arena'
import { Speed, Rotation, Position } from '../types'

/*
 * Round with 5 decimal digits
 */
function round (value: number): number {
  const multiplier = Math.pow(10, 5)

  return Math.round(multiplier * value) / multiplier
}

function calculateNewShotPosition (position: Position, rotation: Rotation, speed: Speed): Position {
  const radians = rotation * Math.PI / 180
  const dX = speed * Math.cos(radians)
  const dY = speed * Math.sin(radians)
  const newX = round(dX + position.x)
  const newY = round(dY + position.y)

  return { x: newX, y: newY }
}

export default function (shots: ArenaShot[], shotSpeed: Speed): ArenaShot[] {
  return shots.map((shot) => {
    shot.position = calculateNewShotPosition(shot.position, shot.rotation, shotSpeed)

    return shot
  })
}
