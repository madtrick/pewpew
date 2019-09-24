import { Arena, ArenaPlayer, ComponentType, UpdateType } from './arena'
import { PLAYER_RADIUS } from '../player'

interface ScanResult {
  type: UpdateType.Scan,
  component: {
    type: ComponentType.Radar,
    data: {
      players: { position: { x: number, y: number } }[],
      unknown: { position: { x: number, y: number } }[]
    }
  }
}

export function scan (scanningPlayer: ArenaPlayer, arena: Arena): ScanResult {
  const players = arena.players()
  const playersToEvaluate = players.filter((player) => player.id !== scanningPlayer.id)
  const scanRadius = 40

  const distancesToPlayers = playersToEvaluate.map((player) => {
    const { x, y } = player.position
    const A = Math.abs(x - scanningPlayer.position.x)
    const B = Math.abs(y - scanningPlayer.position.y)
    const distance = Math.sqrt(A*A + B*B)

    return { distance, player }
  })

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

