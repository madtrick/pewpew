import { Position } from '../types'
import { ComponentType, UpdateType } from './arena'
import { PLAYER_RADIUS } from '../player'

// TODO replace this with this Position type
type ComponentPosition = { position: { x: number, y: number } }

// TODO since this is an update, this type should be named
// something like ScanUpdate. Or maybe keep the result and rename the
// updatetype prop :shrug:
export interface ScanResult {
  type: UpdateType.Scan,
  component: {
    type: ComponentType.Radar,
    data: {
      players: { position: { x: number, y: number } }[],
      unknown: { position: { x: number, y: number } }[],
      shots: ComponentPosition[],
      mines: ComponentPosition[]
    }
  }
}

// TODO: rename this interface to ComponentWithPosition
interface ElementWithPosition {
  type: ComponentType,
  position: Position
}

export type RadarScan = typeof scan
export function scan (position: Position, components: ElementWithPosition[]): ScanResult {
  // TODO: exclude the scanning player from the array of elements to scan
  const componentsToEvaluate = components.filter(({ position: playerPosition }) => {
    return playerPosition.x !== position.x || playerPosition.y !== position.y
  })
  const scanRadius = 40
  const shotIdentifyRadius = scanRadius - 5
  const mineIdentifyRadius = scanRadius - 5

  const distancesToPlayers = componentsToEvaluate.map((component) => {
    const { x, y } = component.position
    const A = Math.abs(x - position.x)
    const B = Math.abs(y - position.y)
    const distance = Math.sqrt(A*A + B*B)

    return { distance, component }
  })

  // TODO decouple this from the player. The scan function should take the scan radious
  // and also detection thresholds as parameters
  const scanResult = distancesToPlayers.reduce((acc: {
    players: ComponentPosition[],
    unknown: ComponentPosition[],
    shots: ComponentPosition[],
    mines: ComponentPosition[]
  }, { distance, component }) => {
    if (component.type === ComponentType.Shot) {
      if (distance <= scanRadius) {
        if (distance <= shotIdentifyRadius) {
          acc.shots.push({ position: { x: component.position.x, y: component.position.y } })
        } else {
          acc.unknown.push({ position: { x: component.position.x, y: component.position.y } })
        }
      }
    }

    if (component.type === ComponentType.Mine) {
      if (distance <= scanRadius) {
        if (distance <= mineIdentifyRadius) {
          acc.mines.push({ position: { x: component.position.x, y: component.position.y } })
        } else {
          acc.unknown.push({ position: { x: component.position.x, y: component.position.y } })
        }
      }
    }

    if (distance <= (scanRadius + PLAYER_RADIUS)) {
      if (distance <= scanRadius) {
        // the center of the component is within the range of the radar
        if (component.type === ComponentType.Player) {
          acc.players.push({ position: { x: component.position.x, y: component.position.y } })
        }
      } else {
        acc.unknown.push({ position: { x: component.position.x, y: component.position.y } })
      }
    }

    return acc
  }, { players: [], unknown: [], shots: [], mines: [] })

  return {
    type: UpdateType.Scan,
    component: {
      type: ComponentType.Radar,
      data: {
        players: scanResult.players,
        unknown: scanResult.unknown,
        shots: scanResult.shots,
        mines: scanResult.mines
      }
    }
  }
}

