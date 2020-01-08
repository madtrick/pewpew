import { ArenaShot, ArenaPlayer, ArenaRadarScanResult, Foo, UpdateType, ComponentType } from '../components/arena'
import { RadarScan } from '../components/radar'
import asyncMoveShots from './async-move-shot'
import { shotHisWalls, shotHitsPlayer } from './async-determine-shot-hits'
import { PLAYER_MAX_SHOTS, PLAYER_RADIUS } from '../player'
import { Mine, MINE_RADIUS, MINE_HIT_COST } from '../mine'

interface Update {
  updates: { type: UpdateType, component: Foo }[]
  players: ArenaPlayer[]
  shots: ArenaShot[]
  mines: Mine[]
}

export default function updateState (
  shots: ArenaShot[],
  mines: Mine[],
  players: ArenaPlayer[],
  arenaDimensions: { width: number, height: number },
  radar: RadarScan,
  tick: number,
  shotUpdateCadence: number,
  shotIncrease: number
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

  const remainingMines: Mine[] = []
  mines.forEach((mine) => {
    const { x: ox, y: oy } = mine.position
    remainingPlayers.forEach((player) => {
      const { x: px, y: py } = player.position
      const value = Math.pow((px - ox), 2) + Math.pow((py - oy), 2)
      // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
      // but will it keep it here in case we have players with different radius

      const collision = Math.pow(PLAYER_RADIUS - MINE_RADIUS, 2) <= value && value <= Math.pow(PLAYER_RADIUS + MINE_RADIUS, 2)

      if (!collision) {
        remainingMines.push(mine)
      } else {
        player.life = player.life - MINE_HIT_COST
        updates.push({
          type: UpdateType.MineHit,
          component: {
            type: ComponentType.Mine,
            data: {
              id: mine.id,
              playerId: player.id
            }
          }
        })
      }
    })
  })

  // TODO OMG, fix this at some point. I'm duplicating the same logic
  // to check for removed players plu introducing a new variable to
  // handle the new set of remaining players
  const finalPlayers: ArenaPlayer[] = []
  remainingPlayers.forEach((player) => {
    if (player.life > 0) {
      finalPlayers.push(player)

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

  const radarUpdates: ArenaRadarScanResult[] = finalPlayers.map((player) => {
    const scanResult = radar(player.position, [...finalPlayers, ...remainingShots, ...remainingMines])
    return {
      type: scanResult.type,
      component: {
        type: scanResult.component.type,
        data: {
          // TODO include mines in the radar?
          playerId: player.id,
          players: scanResult.component.data.players,
          unknown: scanResult.component.data.unknown,
          shots: scanResult.component.data.shots,
          mines: scanResult.component.data.mines
        }
      }
    }
  })

  if (tick % shotUpdateCadence === 0) {
    finalPlayers.forEach((player) => {
      if (player.shots < PLAYER_MAX_SHOTS) {
        if (player.shots + shotIncrease > PLAYER_MAX_SHOTS) {
          player.shots = PLAYER_MAX_SHOTS
        } else {
          player.shots = player.shots + shotIncrease
        }
      }
    })
  }

  return {
    updates: [...updates, ...radarUpdates],
    players: finalPlayers,
    shots: remainingShots,
    mines: remainingMines
  }
}
