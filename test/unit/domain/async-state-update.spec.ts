import { expect } from 'chai'

import { createShot } from '../../../src/shot'
import { createPlayer, PLAYER_MAX_SHOTS } from '../../../src/player'
import { ArenaPlayer, ArenaShot } from '../../../src/components/arena'
import { scan } from '../../../src/components/radar'
import asyncStateUpdate from '../../../src/domain/async-state-update'

describe('Async update', () => {
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

          asyncStateUpdate([shot], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

          expect(player.shots).to.eql(initialShots)
        })
      })

      describe('when the player has less than the maximum number the shots', () => {
        it('increases the counter', () => {
          const initialShots = 1
          player.shots = initialShots

          asyncStateUpdate([shot], [player], { width: 500, height: 500 }, scan, 9, 3, 1)

          expect(player.shots).to.eql(initialShots + 1)
        })

        it('increases the counter to the maximum number of shots per player', () => {
          const initialShots = 1
          player.shots = initialShots

          asyncStateUpdate([shot], [player], { width: 500, height: 500 }, scan, 9, 3, PLAYER_MAX_SHOTS)

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

        asyncStateUpdate([shot], [player], { width: 500, height: 500 }, scan, 8, 3, 1)

        expect(player.shots).to.eql(initialShots)
      })
    })
  })
})
