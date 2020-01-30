import { Position, Rotation } from '../types'
import { ComponentType, UpdateType, ArenaPlayer, ArenaShot } from './arena'
import { Mine } from '../mine'
import { PLAYER_RADIUS } from '../player'

// TODO since this is an update, this type should be named
// something like ScanUpdate. Or maybe keep the result and rename the
// updatetype prop :shrug:
type ScannedUnknown = { position: Position }
type ScannedPlayer = { id: string, rotation: Rotation, position: Position }
type ScannedShot = { rotation: Rotation, position: Position }
type ScannedMine = { position: Position }
export interface ScanResult {
  type: UpdateType.Scan,
  component: {
    type: ComponentType.Radar,
    data: {
      unknown: ScannedUnknown[]
      players: ScannedPlayer[]
      shots: ScannedShot[]
      mines: ScannedMine[]
    }
  }
}

export type ScannablePlayer = Pick<ArenaPlayer, 'id' | 'position' | 'rotation'>
export type ScannableShot = Pick<ArenaShot, 'position' | 'rotation'>
export type ScannableMine = Pick<Mine, 'position'>
export type ScannableComponents = { players: ScannablePlayer[], shots: ScannableShot[], mines: ScannableMine[] }

function calculateDistanceBetweenPositions (positionA: Position, positionB: Position): number {
  const A = Math.abs(positionA.x - positionB.x)
  const B = Math.abs(positionA.y - positionB.y)
  const distance = Math.sqrt(A * A + B * B)

  return distance
}

export type RadarScan = typeof scan
export function scan (
  position: Position,
  components: ScannableComponents
): ScanResult {
  // TODO: exclude the scanning player from the array of elements to scan
  const players = components.players.filter(({ position: playerPosition }) => {
    return playerPosition.x !== position.x || playerPosition.y !== position.y
  })
  const scanRadius = 80
  const shotIdentifyRadius = scanRadius - 5
  const mineIdentifyRadius = scanRadius - 5
  const detectedComponents: ScanResult['component']['data'] = { players: [], shots: [], mines: [], unknown: [] }

  components.shots.forEach((shot) => {
    const distance = calculateDistanceBetweenPositions(position, shot.position)

    if (distance <= scanRadius) {
      if (distance <= shotIdentifyRadius) {
        detectedComponents.shots.push({
          rotation: shot.rotation,
          position: shot.position
        })
      } else {
        detectedComponents.unknown.push({
          position: shot.position
        })
      }
    }
  })

  components.mines.forEach((mine) => {
    const distance = calculateDistanceBetweenPositions(position, mine.position)

    if (distance <= scanRadius) {
      if (distance <= mineIdentifyRadius) {
        detectedComponents.mines.push({ position: mine.position })
      } else {
        detectedComponents.unknown.push({ position: mine.position })
      }
    }
  })

  players.forEach((player) => {
    const distance = calculateDistanceBetweenPositions(position, player.position)

    if (distance <= (scanRadius + PLAYER_RADIUS)) {
      if (distance <= scanRadius) {
        // the center of the component is within the range of the radar
        detectedComponents.players.push({
          id: player.id,
          rotation: player.rotation,
          position: player.position
        })
      } else {
        detectedComponents.unknown.push({ position: player.position })
      }
    }
  })

  return {
    type: UpdateType.Scan,
    component: {
      type: ComponentType.Radar,
      data: detectedComponents
    }
  }
}

