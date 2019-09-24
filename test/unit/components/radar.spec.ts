import { expect } from 'chai'
import { createPlayer } from '../../../src/player'
import { Arena, ComponentType, UpdateType, asSuccess } from '../../../src/components/arena'
import { scan } from '../../../src/components/radar'

describe(' Radar', () => {
  describe('scan', () => {
    describe('when there is only the scanning player in the arena', () => {
      it('returns no matches', () => {
        const arena = new Arena({ width: 500, height: 500 })
        const { player } = asSuccess(arena.registerPlayer(createPlayer({ id: 'player-1' })))

        const result = scan(player, arena)

        expect(result).to.eql({
          type: UpdateType.Scan,
          component: {
            type: ComponentType.Radar,
            data: {
              players: [],
              unknown: []
            }
          }
        })
      })
    })

    describe('when there are players in the radar radious', () => {
      describe('when the players are less than or equal X px away from the scanning player', () => {
        it('returns the match as "players"', () => {
          // https://www.geogebra.org/graphing/b9jcdtpa
          const arena = new Arena({ width: 500, height: 500 })
          const { player: scanningPlayer } = asSuccess(
            arena.registerPlayer(createPlayer({ id: 'scanning-player' }), { position: { x: 50, y: 40 }})
          )
          arena.registerPlayer(createPlayer({ id: 'other-player' }), { position: { x: 90, y: 40 } })

          const result = scan(scanningPlayer, arena)

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                unknown: [],
                players: [{
                  position: {
                    x: 90,
                    y: 40
                  }
                }]
              }
            }
          })
        })
      })

      describe('when the players are more than X px away from the scanning player', () => {
        it('returns the match as "unknown"', () => {
          // https://www.geogebra.org/graphing/b9jcdtpa
          const arena = new Arena({ width: 500, height: 500 })
          const { player: scanningPlayer } = asSuccess(
            arena.registerPlayer(createPlayer({ id: 'scanning-player' }), { position: { x: 50, y: 40 }})
          )
          arena.registerPlayer(createPlayer({ id: 'other-player' }), { position: { x: 100, y: 40 } })

          const result = scan(scanningPlayer, arena)

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                players: [],
                unknown: [{
                  position: {
                    x: 100,
                    y: 40
                  }
                }]
              }
            }
          })
        })
      })
    })
  })
})
