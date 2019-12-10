import { expect } from 'chai'

import { createShot } from '../../../src/shot'
import { createPlayer, PLAYER_RADIUS, PLAYER_MAX_SHOTS } from '../../../src/player'
import { ArenaPlayer, ArenaShot, UpdateType, ComponentType } from '../../../src/components/arena'
import { scan } from '../../../src/components/radar'
import asyncStateUpdate from '../../../src/domain/async-state-update'
import { createMine, Mine, MINE_HIT_COST } from '../../../src/mine'

describe.only('Async update', () => {
  describe('collision with mines', () => {
    let player: ArenaPlayer
    let mine: Mine

    beforeEach(() => {
      player = { ...createPlayer({ id: 'player-1' }), position: { x: 100, y: 100 } }
      mine = { ...createMine({ position: { x: 150, y: 150 } }) }
    })
    // TODO add a test that validates that shot hits are checked before
    // collision with mines
    describe('when there is no collision', () => {
      it('does not remove the mine', () => {
        const { mines } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

        expect(mines).to.eql([mine])
      })
    })

    describe('when there is a collision', () => {
      it('removes the mine', () => {
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        const { mines } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

        expect(mines).to.be.empty
      })

      it('lowers the player life', () => {
        const initialLife = player.life
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

        expect(player.life).to.eql(initialLife - MINE_HIT_COST)
      })

      it('destroyes players', () => {
        const initialLife = 15
        player.life = initialLife
        player.position = { x : 100, y: 100 }
        mine.position = { x: (player.position.x - PLAYER_RADIUS), y: 100 }
        const { players, updates } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

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
        const { updates } = asyncStateUpdate([], [mine], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

        // NOTE I'm accounting here for the radar scan, therefore 2 updates
        // although it feels wrong. If in the future I change how the radar works
        // for example, only emitting updates every other tick, this test could
        // potentially break even though nothing on it changed or is wrong
        expect(updates).to.have.lengthOf(2)
        expect(updates[0]).to.deep.include({
          type: UpdateType.MineHit,
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

  describe('shot counter', () => {
    let player: ArenaPlayer
    let shot: ArenaShot

    beforeEach(() => {
      player = { ...createPlayer({ id: 'player-1' }), position: { x: 100, y: 100 } }
      shot = { ...createShot({ player }), rotation: 0, position: { x: 150, y: 150 } }
    })

    describe('when the the shot counter has to be updated', () => {
      describe('when the player has the maximum number the shots', () => {
        it('does not increase the counter', () => {
          const initialShots = player.shots

          asyncStateUpdate([shot], [], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

          expect(player.shots).to.eql(initialShots)
        })
      })

      describe('when the player has less than the maximum number the shots', () => {
        it('increases the counter', () => {
          const initialShots = 1
          player.shots = initialShots

          asyncStateUpdate([shot], [], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

          expect(player.shots).to.eql(initialShots + 1)
        })

        it('increases the counter to the maximum number of shots per player', () => {
          const initialShots = 1
          player.shots = initialShots

          asyncStateUpdate([shot], [], [player], { width: 500, height: 500 }, scan, 9, 3, PLAYER_MAX_SHOTS)

          expect(player.shots).to.eql(PLAYER_MAX_SHOTS)
        })
      })
    })

    describe('when the the shot counter does not have to be updated', () => {
      it('does not increase the counter', () => {
        const player: ArenaPlayer = { ...createPlayer({ id: 'player-1' }), position: { x: 100, y: 100 } }
        const shot: ArenaShot = { ...createShot({ player }), rotation: 0, position: { x: 150, y: 150 } }
        const initialShots = 1
        player.shots = initialShots

        asyncStateUpdate([shot], [], [player], { width: 500, height: 500 }, scan, 8, 3, 1)

        expect(player.shots).to.eql(initialShots)
      })
    })
  })
})
