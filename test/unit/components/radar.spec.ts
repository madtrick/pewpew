import { expect } from 'chai'
import { ComponentType, UpdateType } from '../../../src/components/arena'
import { scan } from '../../../src/components/radar'

describe(' Radar', () => {
  describe('scan', () => {
    describe('when there is only the scanning player', () => {
      it('returns no matches', () => {
        const result = scan({ x: 100, y: 100 }, [])

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
          const player1 = { position: { x: 50, y: 40 } }
          const player2 = { position: { x: 90, y: 40 } }
          const result = scan(player1.position, [player1, player2])

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
          const player1 = { position: { x: 50, y: 40 } }
          const player2 = { position: { x: 100, y: 40 } }
          const result = scan(player1.position, [player1, player2])

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
