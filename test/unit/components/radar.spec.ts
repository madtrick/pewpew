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
              unknown: [],
              shots: [],
              mines: []
            }
          }
        })
      })
    })

    describe('when there are mines in the radar radius', () => {
      describe('when the mine is less than X px away from the scanning player', () => {
        it('returns the match as "mines"', () => {
          const mine = { position: { x: 55, y: 40 }, type: ComponentType.Mine }

          const result = scan({ x: 30, y: 40 }, [mine])

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                unknown: [],
                players: [],
                shots: [],
                mines: [
                  { position: { x: 55, y: 40 } }
                ]
              }
            }
          })
        })
      })

      describe('when the mines are more than X px away from the scanning player', () => {
        it('returns the match as "unknown"', () => {
          const mine = { position: { x: 66, y: 40 }, type: ComponentType.Mine }

          const result = scan({ x: 30, y: 40 }, [mine])

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                unknown: [
                  { position: { x: 66, y: 40 } }
                ],
                players: [],
                shots: [],
                mines: []
              }
            }
          })
        })
      })
    })

    describe('when there are shots in the radar radius', () => {
      describe('when the shots are less than X px away from the scanning player', () => {
        it('returns the match as "shots"', () => {
          const shot1 = { position: { x: 55, y: 40 }, type: ComponentType.Shot }
          const shot2 = { position: { x: 50, y: 40 }, type: ComponentType.Shot }

          const result = scan({ x: 30, y: 40 }, [shot1, shot2])

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                unknown: [],
                players: [],
                shots: [
                  { position: { x: 55, y: 40 } },
                  { position: { x: 50, y: 40 } }
                ],
                mines: []
              }
            }
          })
        })
      })

      describe('when the shots are more than X px away from the scanning player', () => {
        it('returns the match as "unknown"', () => {
          const shot1 = { position: { x: 66, y: 40 }, type: ComponentType.Shot }

          const result = scan({ x: 30, y: 40 }, [shot1])

          expect(result).to.eql({
            type: UpdateType.Scan,
            component: {
              type: ComponentType.Radar,
              data: {
                unknown: [
                  { position: { x: 66, y: 40 } }
                ],
                players: [],
                shots: [],
                mines: []
              }
            }
          })
        })
      })
    })

    describe('when there are players in the radar radious', () => {
      describe('when the players are less than or equal X px away from the scanning player', () => {
        it('returns the match as "players"', () => {
          // https://www.geogebra.org/graphing/b9jcdtpa
          const player1 = { position: { x: 50, y: 40 }, type: ComponentType.Player }
          const player2 = { position: { x: 90, y: 40 }, type: ComponentType.Player }

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
                }],
                shots: [],
                mines: []
              }
            }
          })
        })
      })

      describe('when the players are more than X px away from the scanning player', () => {
        it('returns the match as "unknown"', () => {
          // https://www.geogebra.org/graphing/b9jcdtpa
          const player1 = { position: { x: 50, y: 40 }, type: ComponentType.Player }
          const player2 = { position: { x: 100, y: 40 }, type: ComponentType.Player }
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
                }],
                shots: [],
                mines: []
              }
            }
          })
        })
      })
    })
  })
})
