import { expect } from 'chai'
import { createPlayer, Player } from '../../../../src/player'
import { PipelineItem } from '../../../../src/domain/state-update-pipeline'
import { GameState } from '../../../../src/game-state'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { config } from '../../../config'
import { createProcessor } from '../../../../src/domain/state-processors/increase-tokens'


describe('State processor - Increase tokens', () => {
  let state: GameState
  let player: Player
  let otherPlayer: Player
  let processor: PipelineItem
  const { initialTokensPerPlayer, maxTokensPerPlayer, tokensIncreaseFactor } = config

  beforeEach(() => {
    state = new GameState({ arena: new Arena({ width: 100, height: 100 }) })
    player = asSuccess(state.registerPlayer(createPlayer({ id: 'player-1', initialTokens: initialTokensPerPlayer }))).player
    otherPlayer = asSuccess(state.registerPlayer(createPlayer({ id: 'player-2', initialTokens: initialTokensPerPlayer }))).player
    processor = createProcessor({ maxTokensPerPlayer, tokensIncreaseFactor })
  })

  it('increases the tokens', async () => {
    await processor(state)

    expect(player.tokens).to.eql(initialTokensPerPlayer + tokensIncreaseFactor)
    expect(otherPlayer.tokens).to.eql(initialTokensPerPlayer + tokensIncreaseFactor)
  })

  it('does not increase the tokens if the values goes above the maximum', async () => {
    const playerTokens = player.tokens = maxTokensPerPlayer - tokensIncreaseFactor + 1

    await processor(state)

    expect(player.tokens).to.eql(playerTokens)
    expect(otherPlayer.tokens).to.eql(initialTokensPerPlayer + tokensIncreaseFactor)
  })
})

