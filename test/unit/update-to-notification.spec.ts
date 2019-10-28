import { expect } from 'chai'
import {
  createControlSession,
  createSession
} from '../../src/session'
import { UpdateType, ComponentType } from '../../src/components/arena'
import updateToNotifications, { ComponentUpdate } from '../../src/update-to-notifications'

describe('Update to notification', () => {
  describe('UpdateType.Movement', () => {
    it('generates a Movement notification for the controllers', () => {
      const update: ComponentUpdate = {
        type: UpdateType.Movement,
        component: {
          type: ComponentType.Shot,
          data: {
            id: 'shot-1',
            position: { x: 100, y: 100 }
          }
        }
      }

      const playerSession = createSession()
      const controlSession = createControlSession()
      const sessions = [playerSession, controlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(1)
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
    })
  })

  describe('UpdateType.Hit', () => {
    describe('when the shot hit a wall', () => {
      it('generates a Hit notification for the controllers', () => {
        const shot = { id: 'shot-1' }
        const update: ComponentUpdate = {
          type: UpdateType.Hit,
          component: {
            type: ComponentType.Wall,
            data: {
              shotId: shot.id,
              position: { x: 100, y: 100 }
            }
          }
        }

        const playerSession = createSession()
        const controlSession = createControlSession()
        const sessions = [playerSession, controlSession]

        const result = updateToNotifications(update, sessions)

        expect(result).to.have.lengthOf(1)
        expect(result[0]).to.eql({
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Wall'
            }
          }
        })
      })
    })

    it('generates a Hit notification for the controllers and the affected player', () => {
      const shot = { id: 'shot-1' }
      const update: ComponentUpdate = {
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

      const hitPlayerSession = createSession()
      hitPlayerSession.playerId = 'player-1'
      const otherPlayerSession = createSession()
      otherPlayerSession.playerId = 'player-2'

      const controlSession = createControlSession()
      const sessions = [hitPlayerSession, otherPlayerSession, controlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.eql({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'Hit',
          component: {
            type: 'Player',
            data: {
              id: 'player-1',
              damage: 1
            }
          }
        }
      })
      expect(result[1]).to.eql({
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

  describe('UpdateType.Scan', () => {
    it('generates a scan notification', () => {
      // TODO add another player
      const scannedPlayerPosition = { position: { x: 1, y: 2 } }
      const scannedUnknownPosition = { position: { x: 2, y: 3 } }
      const scannedShotPosition = { position: { x: 3, y: 4 } }
      const update: ArenaRadarScanResult = {
        type: UpdateType.Scan,
        component: {
          type: ComponentType.Radar,
          data: {
            playerId: 'player-1',
            players: [scannedPlayerPosition],
            unknown: [scannedUnknownPosition],
            shots: [scannedShotPosition]
          }
        }
      }

      const playerSession = createSession()
      playerSession.playerId = 'player-1'
      const controlSession = createControlSession()
      const sessions = [playerSession, controlSession]

      const result = updateToNotifications(update, sessions)

      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.eql({
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'RadarScan',
          data: {
            players: [scannedPlayerPosition],
            unknown: [scannedUnknownPosition],
            shots: [scannedShotPosition]
          }
        }
      })
    })

  })
})

