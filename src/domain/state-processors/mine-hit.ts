import { GameState } from '../../game-state'
import { asSuccess } from '../../components/arena'
import { UpdateType, ComponentType } from '../../types'
import { MINE_RADIUS, MINE_HIT_COST } from '../../mine'
import { PLAYER_RADIUS } from '../../player'
import { PipelineItem, Update } from '../state-update-pipeline'

export function createProcessor (): PipelineItem {
  return async function processor (state: GameState): Promise<{ newState: GameState, updates: Update[] }> {
    const mines = state.mines()
    const updates: Update[] = []

    mines.forEach((mine) => {
      const { x: ox, y: oy } = mine.position
      const players = state.players()

      players.forEach((player) => {
        const { x: px, y: py } = player.position
        const value = Math.pow((px - ox), 2) + Math.pow((py - oy), 2)
        // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
        // but will it keep it here in case we have players with different radius

        const collision = Math.pow(PLAYER_RADIUS - MINE_RADIUS, 2) <= value && value <= Math.pow(PLAYER_RADIUS + MINE_RADIUS, 2)

        if (collision) {
          asSuccess(state.removeMine(mine))
          player.life = player.life - MINE_HIT_COST
          updates.push({
            type: UpdateType.Hit,
            component: {
              type: ComponentType.Mine,
              data: {
                id: mine.id,
                playerId: player.id,
                damage: MINE_HIT_COST
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
    })

    return {
      newState: state,
      updates
    }
  }
}
