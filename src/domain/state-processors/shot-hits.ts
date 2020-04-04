import { GameState } from '../../game-state'
import { asSuccess, ArenaPlayer, ArenaShot } from '../../components/arena'
import { UpdateType, ComponentType } from '../../types'
import { SHOT_RADIUS } from '../../shot'
import { PLAYER_RADIUS } from '../../player'
import { PipelineItem, Update } from '../state-update-pipeline'

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

export function createProcessor (arenaDimensions: { width: number, height: number }): PipelineItem {
  return async function processor (state: GameState): Promise<{ newState: GameState, updates: Update[] }> {
    const shots = state.shots()
    const updates: Update[] = []
    const { width, height } = arenaDimensions

    shots.forEach((shot) => {
      const { x, y } = shot.position
      const collidesWithWall = ((x + SHOT_RADIUS) >= width)
        || ((y + SHOT_RADIUS) >= height)
        || ((x - SHOT_RADIUS) <= 0)
        || ((y - SHOT_RADIUS) <= 0)

      if (collidesWithWall) {
        asSuccess(state.removeShot(shot))
        updates.push({
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Wall,
            data: { position: shot.position, shotId: shot.id }
          }
        })

        return
      }

      const player = state.players().find((player) => shotHitsPlayer(shot, player))

      if (player) {
        asSuccess(state.removeShot(shot))
        player.life = player.life - shot.damage

        updates.push({
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
        })

        if (player.life <= 0) {
          asSuccess(state.removePlayer(player))
          updates.push({
            type: UpdateType.PlayerDestroyed,
            component: {
              type: ComponentType.DestroyedPlayer,
              data: {
                id: player.id
              }
            }
          })
        }
      }
    })

    return {
      newState: state,
      updates
    }
  }
}
