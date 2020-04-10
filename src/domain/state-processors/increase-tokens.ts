import { PipelineItem } from '../state-update-pipeline'
import { GameState } from '../../game-state'

export function createProcessor(options: { maxTokensPerPlayer: number, tokensIncreaseFactor: number }): PipelineItem {
  return async function processor (state: GameState) {
    state.players().forEach((player) => {
      const updatedTokensValue = player.tokens + options.tokensIncreaseFactor

      console.log(updatedTokensValue)
      if (updatedTokensValue < options.maxTokensPerPlayer) {
        player.tokens = updatedTokensValue
      }
    })

    return { newState: state, updates: [] }
  }
}

