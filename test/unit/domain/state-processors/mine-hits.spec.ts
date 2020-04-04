import { expect } from 'chai'
import { UpdateType, ComponentType } from '../../../../src/types'
import { GameState } from '../../../../src/game-state'
import { Arena, ArenaPlayer, asSuccess } from '../../../../src/components/arena'
import { createMine, Mine, MINE_HIT_COST } from '../../../../src/mine'
import { createPlayer, PLAYER_RADIUS } from '../../../../src/player'
import { createProcessor } from '../../../../src/domain/state-processors/mine-hit'
import { config } from '../../../config'

describe('State processor - Mine hits', () => {
  let arena: Arena
  let state: GameState
  let arenaPlayer: ArenaPlayer
  let mine: Mine
  const arenaWidth = 300
  const arenaHeight = 300
  const player1 = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
  const processor = createProcessor()

  beforeEach(() => {
    arena = new Arena({ width: arenaWidth, height: arenaHeight })
    state = new GameState({ arena })
    arenaPlayer = asSuccess(state.registerPlayer(player1)).player
    mine = createMine({ position: { x: 150, y: 150 } })
    asSuccess(state.registerMine(mine))
  })

  describe('collision with mines', () => {
    describe('when there is no collision', () => {
      it('does not remove the mine', async () => {
        const { newState, updates } = await processor(state)

        const mines = newState.mines()
        expect(mines).to.eql([mine])
        expect(updates).to.be.empty
      })
    })

    describe('when there is a collision', () => {
      it('removes the mine', async () => {
        arenaPlayer.position = { x : 100, y: 100 }
        mine.position = { x: (arenaPlayer.position.x - PLAYER_RADIUS), y: 100 }

        const { newState } = await processor(state)

        const mines = newState.mines()
        expect(mines).to.be.empty
      })

      it('lowers the player life', async () => {
        const initialLife = arenaPlayer.life
        arenaPlayer.position = { x : 100, y: 100 }
        mine.position = { x: (arenaPlayer.position.x - PLAYER_RADIUS), y: 100 }

        await processor(state)

        expect(arenaPlayer.life).to.eql(initialLife - MINE_HIT_COST)
      })

      it('destroyes the player that collided with the mine if its life is low enough', async () => {
        arenaPlayer.life = MINE_HIT_COST
        arenaPlayer.position = { x : 100, y: 100 }
        mine.position = { x: (arenaPlayer.position.x - PLAYER_RADIUS), y: 100 }
        const { newState, updates } = await processor(state)

        const players = newState.players()
        expect(players).to.be.empty
        expect(updates).to.have.lengthOf(2)
        expect(updates[1]).to.eql({
          type: UpdateType.PlayerDestroyed,
          component: {
            type: ComponentType.DestroyedPlayer,
            data: {
              id: arenaPlayer.id
            }
          }
        })
      })

      it('returns the appropiate update', async () => {
        arenaPlayer.position = { x : 100, y: 100 }
        mine.position = { x: (arenaPlayer.position.x - PLAYER_RADIUS), y: 100 }

        const { updates } = await processor(state)

        expect(updates).to.eql([{
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Mine,
            data: {
              id: mine.id,
              playerId: arenaPlayer.id,
              damage: MINE_HIT_COST
            }
          }
        }])
      })
    })
  })
})
