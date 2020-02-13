import { ComponentType, UpdateType } from '../../types'
import { GameState } from '../../game-state'
import { Update, PipelineItem } from '../state-update-pipeline'
import { RadarScan } from '../../components/radar'

export function createProcessor (scan: RadarScan): PipelineItem {
  return async function processor (state: GameState): Promise<{ newState: GameState, updates: Update[] }> {
    const updates: Update[] = []
    const players = state.players()
    const shots = state.shots()
    const mines = state.mines()
    const context = { players, mines, shots }

    players.forEach((player) => {
      const scanResults = scan(player.position, context)

      updates.push({
        type: UpdateType.Scan,
        component: {
          type: ComponentType.Radar,
          data: {
            playerId: player.id,
            ...scanResults
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
