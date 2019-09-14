import { expect } from 'chai'
import {
  createSession,
  createControlSession
} from '../../src/session'
import resultToResponseAndNotifications from '../../src/result-to-response-notifications'
import { RequestType, CommandType, SuccessRequestResult, SuccessCommandResult } from '../../src/message-handlers'

describe('Result to response', () => {
  describe('RequesType.RegisterPlayer', () => {
    describe('when the player was successfully registered', () => {
      it('generates a RegisterPlayer response for the player and a notification for the controller', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.RegisterPlayer,
          details: {
            id: 'player-1',
            position: {
              x: 100,
              y: 100
            }
          }
        }

        const playerSession = createSession()
        playerSession.playerId = 'player-1'
        const controlSession = createControlSession()
        const sessions = [playerSession, controlSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(2)
        expect(responsesAndNotifications[0]).to.eql({
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'RegisterPlayer',
            success: true,
            component: {
              type: 'Player',
              data: {
                id: 'player-1',
                position: {
                  x: 100,
                  y: 100
                }
              }
            }
          }
        })
        expect(responsesAndNotifications[1]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: 'RegisterPlayer',
            success: true,
            details: {
              position: {
                x: 100,
                y: 100
              }
            }
          }
        })
      })
    })
  })

  describe('RequesType.MovePlayer', () => {
    describe('when the player was successfully moved', () => {
      it('generates a MovePlayer response', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.MovePlayer,
          details: {
            id: 'player-1',
            position: {
              x: 100,
              y: 100
            }
          }
        }

        const playerSession = createSession()
        playerSession.playerId = 'player-1'
        const sessions = [playerSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(1)
        expect(responsesAndNotifications[0]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: 'MovePlayer',
            success: true,
            details: {
              position: {
                x: 100,
                y: 100
              }
            }
          }
        })
      })
    })
  })

  describe('RequesType.Shoot', () => {
    describe('when the was successful', () => {
      it('generates a Shoot response', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.Shoot,
          details: {
            id: 'player-1'
          }
        }

        const playerSession = createSession()
        playerSession.playerId = 'player-1'
        const sessions = [playerSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(1)
        expect(responsesAndNotifications[0]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: 'Shoot',
            success: true
          }
        })
      })
    })
  })

  describe('commands', () => {
    describe('CommandType.StartGame', () => {
      describe('when the was successful', () => {
        it('generates a Shoot response', () => {
          const result: SuccessCommandResult = {
            success: true,
            command: CommandType.StartGame
          }

          const playerSession = createSession()
          const otherPlayerSession = createSession()
          const controlSession = createControlSession()
          const sessions = [playerSession, otherPlayerSession, controlSession]

          const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

          expect(responsesAndNotifications).to.have.lengthOf(3)
          expect(responsesAndNotifications[0]).to.eql({
            session: controlSession,
            response: {
              type: 'Response',
              id: 'StartGame',
              success: true
            }
          })
          expect(responsesAndNotifications[1]).to.eql({
            session: playerSession,
            notification: {
              type: 'Notification',
              id: 'StartGame'
            }
          })
          expect(responsesAndNotifications[2]).to.eql({
            session: otherPlayerSession,
            notification: {
              type: 'Notification',
              id: 'StartGame'
            }
          })
        })
      })
    })
  })
})

