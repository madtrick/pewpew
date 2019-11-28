import { ArenaShot, ArenaPlayer, ArenaRadarScanResult, Foo, UpdateType, ComponentType } from '../components/arena'
import { RadarScan } from '../components/radar'
import asyncMoveShots from './async-move-shot'
import { shotHisWalls, shotHitsPlayer } from './async-determine-shot-hits'

interface Update {
  updates: { type: UpdateType, component: Foo }[]
  players: ArenaPlayer[]
  shots: ArenaShot[]
}

export default function updateState (
  shots: ArenaShot[],
  players: ArenaPlayer[],
  arenaDimensions: { width: number, height: number },
  radar: RadarScan
): Update {
  const movedShots = asyncMoveShots(shots, 1)
  const remainingShots: ArenaShot[] = []
  const updates: { type: UpdateType, component: Foo }[] = movedShots.map((shot) => {
    const hit = shotHisWalls(shot, { width: arenaDimensions.width, height: arenaDimensions.height })

    if (hit) {
      return {
        type: UpdateType.Hit,
        component: {
          type: ComponentType.Wall,
          data: { position: shot.position, shotId: shot.id }
        }
      }
    }

    const player = players.find((player) => {
      if (player.life === 0) {
        return false
      }

      return shotHitsPlayer(shot, player)
    })

    if (player) {
      player.life = player.life - shot.damage

      return {
        type: UpdateType.Hit,
        component: {
          type: ComponentType.Player,
          data: {
            id: player.id,
            life: player.life,
            damage: shot.damage,
            shotId: shot.id
          }
        }
      }
    }

    remainingShots.push(shot)

    return {
      type: UpdateType.Movement,
      component: {
        type: ComponentType.Shot,
        data: {
          id: shot.id,
          position: shot.position
        }
      }
    }
  })

  const remainingPlayers: ArenaPlayer[] = []

  players.forEach((player) => {
    if (player.life > 0) {
      remainingPlayers.push(player)

      return
    }

    updates.push({
      type: UpdateType.PlayerDestroyed,
      component: {
        type: ComponentType.DestroyedPlayer,
        data: {
          id: player.id
        }
      }
    })
  })

  const radarUpdates: ArenaRadarScanResult[] = remainingPlayers.map((player) => {
    const scanResult = radar(player.position, [...remainingPlayers, ...remainingShots])
    return {
      type: scanResult.type,
      component: {
        type: scanResult.component.type,
        data: {
          playerId: player.id,
          players: scanResult.component.data.players,
          unknown: scanResult.component.data.unknown,
          shots: scanResult.component.data.shots
        }
      }
    }
  })

  return {
    updates: [...updates, ...radarUpdates],
    players: remainingPlayers,
    shots: remainingShots
  }
}
