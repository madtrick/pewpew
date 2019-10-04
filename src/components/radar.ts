import { Position, ComponentType, UpdateType } from './arena'
import { PLAYER_RADIUS } from '../player'

// TODO since this is an update, this type should be named
// something like ScanUpdate. Or maybe keep the result and rename the 
// updatetype prop :shrug:
export interface ScanResult {
  type: UpdateType.Scan,
  component: {
    type: ComponentType.Radar,
    data: {
      players: { position: { x: number, y: number } }[],
      unknown: { position: { x: number, y: number } }[]
    }
  }
}

interface ElementWithPosition {
  position: Position
}

export type RadarScan = typeof scan
export function scan (position: Position, players: ElementWithPosition[]): ScanResult {
  const playersToEvaluate = players.filter(({ position: playerPosition }) => {
    return playerPosition.x !== position.x || playerPosition.y !== position.y
  })
  const scanRadius = 40

  const distancesToPlayers = playersToEvaluate.map((player) => {
    const { x, y } = player.position
    const A = Math.abs(x - position.x)
    const B = Math.abs(y - position.y)
    const distance = Math.sqrt(A*A + B*B)

    return { distance, player }
  })

  // TODO replace this with this Position type
  // TODO decouple this from the player. The scan function should take the scan radious
  // and also detection thresholds as parameters
  type PlayerPosition = { position: { x: number, y: number } }
  const playersOrUnknown = distancesToPlayers.reduce((acc: { players: PlayerPosition[], unknown: PlayerPosition[] }, { distance, player }) => {
    if (distance <= (scanRadius + PLAYER_RADIUS)) {
      if (distance <= scanRadius) {
        // the center of the player is within the range of the radar
        acc.players.push({ position: { x: player.position.x, y: player.position.y } })
      } else {
        acc.unknown.push({ position: { x: player.position.x, y: player.position.y } })
      }
    }

    return acc
  }, { players: [], unknown: [] })

  return {
    type: UpdateType.Scan,
    component: {
      type: ComponentType.Radar,
      data: {
        players: playersOrUnknown.players,
        unknown: playersOrUnknown.unknown
      }
    }
  }
}

