import { expect } from 'chai'

import { createShot } from '../../../src/shot'
import { createPlayer, PLAYER_RADIUS } from '../../../src/player'
import { ArenaPlayer, UpdateType, ComponentType } from '../../../src/components/arena'
import { scan } from '../../../src/components/radar'
import asyncStateUpdate from '../../../src/domain/async-state-update'
import { createMine, Mine, MINE_HIT_COST } from '../../../src/mine'
import { config } from '../../config'

describe('Async update', () => {
  const tokenIncreasePerTick = 1

  describe('collision with mines', () => {
    let player: ArenaPlayer
    let mine: Mine

    beforeEach(() => {
      player = {
        ...createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer }),
        position: { x: 100, y: 100 }
      }
      mine = { ...createMine({ position: { x: 150, y: 150 } }) }
    })
    // TODO add a test that validates that shot hits are checked before
    // collision with mines
    describe('when there is no collision', () => {
      it('does not remove the mine', () => {
        const { mines } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, config)

        expect(mines).to.eql([mine])
      })
    })

    describe('when there is a collision', () => {
      it('removes the mine', () => {
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        const { mines } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, config)

        expect(mines).to.be.empty
      })

      it('lowers the player life', () => {
        const initialLife = player.life
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, config)

        expect(player.life).to.eql(initialLife - MINE_HIT_COST)
      })

      it('destroyes players', () => {
        const initialLife = 15
        player.life = initialLife
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        const { players, updates } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, config)

        expect(players).to.be.empty
        expect(updates).to.have.lengthOf(2)
        expect(updates[1]).to.eql({
          type: UpdateType.PlayerDestroyed,
          component: {
            type: ComponentType.DestroyedPlayer,
            data: {
              id: player.id
            }
          }
        })
      })

      it('returns the appropiate update', () => {
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        const { updates } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, config)

        // NOTE I'm accounting here for the radar scan, therefore 2 updates
        // although it feels wrong. If in the future I change how the radar works
        // for example, only emitting updates every other tick, this test could
        // potentially break even though nothing on it changed or is wrong
        expect(updates).to.have.lengthOf(2)
        expect(updates[0]).to.deep.include({
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Mine,
            data: {
              id: mine.id,
              playerId: player.id
            }
          }
        })
      })
    })
  })

  describe('shot hits', () => {
    it('recognizes hits when the shot is inside the player', () => {
      const player = { ...createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer }), position: { x: 100, y: 100 } }
      const shooter = { ...createPlayer({ id: 'shooter', initialTokens: config.initialTokensPerPlayer }), position: { x: 200, y: 200 } }
      const shot = { ...createShot({ player: shooter }), rotation: 0, position: { x: 90, y: 90 } }
      const initialLife = player.life

      asyncStateUpdate([shot], [], [player, shooter], { width: 500, height: 500 }, scan, config)

      expect(player.life).to.eql(initialLife - shot.damage)
    })
  })

  describe('player tokens', () => {
    let player: ArenaPlayer

    beforeEach(() => {
      player = { ...createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer }), position: { x: 100, y: 100 } }
    })

    it('increases the tokens', () => {
      const initialTokens = player.tokens

      asyncStateUpdate([], [], [player], { width: 500, height: 500 }, scan, config)

      expect(player.tokens).to.eql(initialTokens + tokenIncreasePerTick)
    })

    it('does not increase the tokens above the limit', () => {
      player.tokens = config.maxTokensPerPlayer - 1
      const initialTokens = player.tokens

      asyncStateUpdate([], [], [player], { width: 500, height: 500 }, scan, config)

      expect(player.tokens).to.eql(initialTokens)
    })
  })
})
