import { expect } from 'chai'
import { createControlSession, createSession } from '../../src/session'
import { UpdateType, ComponentType } from '../../src/types'
import updateToNotifications from '../../src/update-to-notifications'
import { Update } from '../../src/domain/state-update-pipeline'

describe('Update to notification', () => {
  describe('UpdateType.RemovePlayer', () => {
    it('generates a Movement notification for the controllers', () => {
      const update: Update = {
        type: UpdateType.RemovePlayer,
        component: {
          type: ComponentType.Player,
          data: {
            id: 'player-1'
          }
        }
      }

      // TODO pull the channel ref generation to an utility function
      const playerSession = createSession({ id: 'channel-1' })
      const controlSession = createControlSession({ id: 'channel-2' })
      const anotherControlSession = createControlSession({ id: 'channel-3' })
      const sessions = [playerSession, controlSession, anotherControlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.eql({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'RemovePlayer',
          component: {
            type: 'Player',
            data: {
              id: 'player-1'
            }
          }
        }
      })
      expect(result[1]).to.eql({
        session: anotherControlSession,
        notification: {
          type: 'Notification',
          id: 'RemovePlayer',
          component: {
            type: 'Player',
            data: {
              id: 'player-1'
            }
          }
        }
      })
    })
  })

  describe('UpdateType.Movement', () => {
    it('generates a Movement notification for the controllers', () => {
      const update: Update = {
        type: UpdateType.Movement,
        component: {
          type: ComponentType.Shot,
          data: {
            id: 'shot-1',
            position: { x: 100, y: 100 }
          }
        }
      }

      // TODO pull the channel ref generation to an utility function
      const playerSession = createSession({ id: 'channel-1' })
      const controlSession = createControlSession({ id: 'channel-2' })
      const anotherControlSession = createControlSession({ id: 'channel-3' })
      const sessions = [playerSession, controlSession, anotherControlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.eql({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'Movement',
          component: {
            type: 'Shot',
            data: {
              id: 'shot-1',
              position: {
                x: 100,
                y: 100
              }
            }
          }
        }
      })

      expect(result[1]).to.eql({
        session: anotherControlSession,
        notification: {
          type: 'Notification',
          id: 'Movement',
          component: {
            type: 'Shot',
            data: {
              id: 'shot-1',
              position: {
                x: 100,
                y: 100
              }
            }
          }
        }
      })
    })
  })

  describe('UpdateType.Hit', () => {
    describe('shot hits', () => {
      describe('when the shot hits a wall', () => {
        it('generates a Hit notification for the controllers', () => {
          const shot = { id: 'shot-1' }
          const update: Update = {
            type: UpdateType.Hit,
            component: {
              type: ComponentType.Wall,
              data: {
                shotId: shot.id,
                position: { x: 100, y: 100 }
              }
            }
          }

          const playerSession = createSession({ id: 'channel-1' })
          const controlSession = createControlSession({ id: 'channel-2' })
          const anotherControlSession = createControlSession({ id: 'channel-3' })
          const sessions = [playerSession, controlSession, anotherControlSession]

          const result = updateToNotifications(update, sessions)

          expect(result).to.have.lengthOf(2)
          expect(result[0]).to.eql({
            session: controlSession,
            notification: {
              type: 'Notification',
              id: 'Hit',
              component: {
                type: 'Wall',
                data: {
                  shotId: shot.id
                }
              }
            }
          })
          expect(result[1]).to.eql({
            session: anotherControlSession,
            notification: {
              type: 'Notification',
              id: 'Hit',
              component: {
                type: 'Wall',
                data: {
                  shotId: shot.id
                }
              }
            }
          })
        })
      })

      it('generates a Hit notification for the controllers and the affected player', () => {
        const shot = { id: 'shot-1' }
        const update: Update = {
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Player,
            data: {
              shotId: shot.id,
              id: 'player-1',
              life: 99,
              damage: 1
            }
          }
        }

        const hitPlayerSession = createSession({ id: 'channel-1' })
        hitPlayerSession.playerId = 'player-1'
        const otherPlayerSession = createSession({ id: 'channel-2' })
        otherPlayerSession.playerId = 'player-2'

        const controlSession = createControlSession({ id: 'channel-3' })
        const anotherControlSession = createControlSession({ id: 'channel-4' })
        const sessions = [hitPlayerSession, otherPlayerSession, controlSession, anotherControlSession]

        const result = updateToNotifications(update, sessions)

        expect(result).to.have.lengthOf(3)
        expect(result[0]).to.eql({
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Player',
              data: {
                shotId: shot.id,
                id: 'player-1',
                damage: 1
              }
            }
          }
        })
        expect(result[1]).to.eql({
          session: anotherControlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Player',
              data: {
                shotId: shot.id,
                id: 'player-1',
                damage: 1
              }
            }
          }
        })
        expect(result[2]).to.eql({
          session: hitPlayerSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            data: {
              damage: 1
            }
          }
        })
      })
    })

    describe('mine hits', () => {
      it('generates a Hit notification for the controllers and the affected player', () => {
        const playerId = 'player-1'
        const mine = { id: 'mine-1' }
        const update: Update = {
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Mine,
            data: {
              id: 'mine-1',
              playerId,
              damage: 20
            }
          }
        }

        const hitPlayerSession = createSession({ id: 'channel-1' })
        hitPlayerSession.playerId = playerId
        const otherPlayerSession = createSession({ id: 'channel-2' })
        otherPlayerSession.playerId = 'player-2'

        const controlSession = createControlSession({ id: 'channel-3' })
        const anotherControlSession = createControlSession({ id: 'channel-4' })
        const sessions = [hitPlayerSession, otherPlayerSession, controlSession, anotherControlSession]

        const result = updateToNotifications(update, sessions)

        expect(result).to.have.lengthOf(3)
        expect(result[0]).to.eql({
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Mine',
              data: {
                id: mine.id,
                playerId: 'player-1',
                damage: 20
              }
            }
          }
        })
        expect(result[1]).to.eql({
          session: anotherControlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Mine',
              data: {
                id: mine.id,
                playerId: 'player-1',
                damage: 20
              }
            }
          }
        })
        expect(result[2]).to.eql({
          session: hitPlayerSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            data: {
              damage: 20
            }
          }
        })
      })

    })
  })

  describe('UpdateType.Scan', () => {
    it('generates a scan notification', () => {
      // TODO add another player
      const scannedPlayer = { position: { x: 1, y: 2 }, id: 'player-1', rotation: 45 }
      const scannedUnknown = { position: { x: 2, y: 3 } }
      const scannedShot = { position: { x: 3, y: 4 }, rotation: 30 }
      const scannedMine = { position: { x: 4, y: 5 } }
      const update: Update = {
        type: UpdateType.Scan,
        component: {
          type: ComponentType.Radar,
          data: {
            playerId: 'player-1',
            players: [scannedPlayer],
            unknown: [scannedUnknown],
            shots: [scannedShot],
            mines: [scannedMine]
          }
        }
      }

      const playerSession = createSession({ id: 'channel-1' })
      playerSession.playerId = 'player-1'
      const controlSession = createControlSession({ id: 'channel-2' })
      const sessions = [playerSession, controlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.eql({
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'RadarScan',
          data: {
            players: [scannedPlayer],
            unknown: [scannedUnknown],
            shots: [scannedShot],
            mines: [scannedMine]
          }
        }
      })
    })
  })

  describe('UpdateType.PlayerDestroyed', () => {
    it('generates player destroyed notifications', () => {
      const update: Update = {
        type: UpdateType.PlayerDestroyed,
        component: {
          type: ComponentType.DestroyedPlayer,
          data: {
            id: 'player-1'
          }
        }
      }

      const playerOneSession = createSession({ id: 'channel-1' })
      playerOneSession.playerId = 'player-1'
      const playerTwoSession = createSession({ id: 'channel-2' })
      playerTwoSession.playerId = 'player-2'
      const controlSession = createControlSession({ id: 'channel-3' })
      const anotherControlSession = createControlSession({ id: 'channel-4' })
      const sessions = [playerOneSession, playerTwoSession, controlSession, anotherControlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(3)
      expect(result[0]).to.eql({
        session: playerOneSession,
        notification: {
          type: 'Notification',
          id: 'Destroyed'
        }
      })
      expect(result[1]).to.eql({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'PlayerDestroyed',
          component: {
            type: 'Player',
            data: {
              id: 'player-1'
            }
          }
        }
      })
      expect(result[2]).to.eql({
        session: anotherControlSession,
        notification: {
          type: 'Notification',
          id: 'PlayerDestroyed',
          component: {
            type: 'Player',
            data: {
              id: 'player-1'
            }
          }
        }
      })
    })
  })
})

