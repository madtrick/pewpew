import { expect } from 'chai'
import {
  createSession,
  createControlSession
} from '../../src/session'
import resultToResponseAndNotifications from '../../src/result-to-response-notifications'
import {
  RequestType,
  CommandType,
  SuccessRequestResult,
  SuccessfulRotateRequest,
  FailureRegisterPlayerRequest,
  FailureShootRequest,
  FailureMoveRequest,
  FailureRotatePlayerRequest,
  SuccessCommandResult,
  FailureCommandResult
} from '../../src/message-handlers'

describe('Result to response', () => {
  const playerOneId = 'player-1'

  describe('RequesType.RegisterPlayer', () => {
    describe('when the player was could not be registered', () => {
      it('generates a Error response for the player', () => {
        const playerSession = createSession()
        const result: FailureRegisterPlayerRequest = {
          session: playerSession,
          success: false,
          request: RequestType.RegisterPlayer,
          reason: `Some error`
        }
        const controlSession = createControlSession()
        const sessions = [playerSession, controlSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.eql([{
          session: playerSession,
          response: {
            type: 'Response',
            id: 'RegisterPlayer',
            success: false,
            details: {
              msg: 'Some error'
            }
          }
        }])
      })
    })

    describe('when the player was successfully registered', () => {
      it('generates a RegisterPlayer response for the player and a notification for the controller', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.RegisterPlayer,
          details: {
            id: playerOneId,
            position: {
              x: 100,
              y: 100
            }
          }
        }

        const playerSession = createSession()
        playerSession.playerId = playerOneId
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
                id: playerOneId,
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
    describe('when the player could not be moved', () => {
      it('generates a MovePlayer response', () => {
        const playerSession = createSession()
        const sessions = [playerSession]
        const result: FailureMoveRequest = {
          session: playerSession,
          success: false,
          request: RequestType.MovePlayer,
          reason: 'Some error'
        }

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.eql([{
          session: playerSession,
          response: {
            type: 'Response',
            id: 'MovePlayer',
            success: false,
            details: {
              msg: 'Some error'
            }
          }
        }])
      })
    })

    describe('when the player was successfully moved', () => {
      it('generates a MovePlayer response', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.MovePlayer,
          details: {
            id: playerOneId,
            position: {
              x: 100,
              y: 100
            }
          }
        }

        const playerSession = createSession()
        const controlSession = createControlSession()
        playerSession.playerId = playerOneId
        const sessions = [playerSession, controlSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(2)
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
        expect(responsesAndNotifications[1]).to.eql({
          session: controlSession,
          response: {
            type: 'Notification',
            id: 'Movement',
            component: {
              type: 'Player',
              data: {
                id: playerOneId,
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
  })

  describe('RequesType.Shoot', () => {
    describe('when the request was a failure', () => {
      it('generates a failure response', () => {
        const playerSession = createSession()
        const sessions = [playerSession]
        const result: FailureShootRequest = {
          session: playerSession,
          success: false,
          request: RequestType.Shoot,
          reason: 'Some reason'
        }


        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(1)
        expect(responsesAndNotifications[0]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.Shoot,
            success: false,
            details: {
              msg: 'Some reason'
            }
          }
        })
      })
    })

    describe('when the request was successful', () => {
      it('generates a Shoot response', () => {
        const result: SuccessRequestResult = {
          success: true,
          request: RequestType.Shoot,
          details: {
            id: playerOneId
          }
        }

        const playerSession = createSession()
        playerSession.playerId = playerOneId
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

  describe('RequesType.RotatePlayer', () => {
    describe('when the request was a failure', () => {
      it('generates a failure response', () => {
        const playerSession = createSession()
        const sessions = [playerSession]
        const result: FailureRotatePlayerRequest = {
          session: playerSession,
          success: false,
          request: RequestType.RotatePlayer,
          reason: 'Some reason'
        }


        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(1)
        expect(responsesAndNotifications[0]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.RotatePlayer,
            success: false,
            details: {
              msg: 'Some reason'
            }
          }
        })
      })
    })

    describe('when the request was successful', () => {
      it('generates a Rotate response', () => {
        const rotation = 300
        const result: SuccessfulRotateRequest = {
          success: true,
          request: RequestType.RotatePlayer,
          details: {
            id: playerOneId,
            rotation
          }
        }

        const controlSession = createControlSession()
        const playerSession = createSession()
        playerSession.playerId = playerOneId
        const sessions = [playerSession, controlSession]

        const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

        expect(responsesAndNotifications).to.have.lengthOf(2)
        expect(responsesAndNotifications[0]).to.eql({
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.RotatePlayer,
            success: true
          }
        })
        expect(responsesAndNotifications[1]).to.eql({
          session: controlSession,
          response: {
            type: 'Notification',
            id: 'ComponentUpdate',
            component: {
              type: 'Player',
              data: {
                id: playerOneId,
                rotation
              }
            }
          }
        })
      })
    })
  })

  describe('commands', () => {
    describe('CommandType.StartGame', () => {
      describe('when there was an error', () => {
        it('generates a response', () => {
          const result: FailureCommandResult = {
            success: false,
            command: CommandType.StartGame,
            reason: 'Some error'
          }

          const playerSession = createSession()
          const controlSession = createControlSession()
          const sessions = [playerSession, controlSession]

          const responsesAndNotifications = resultToResponseAndNotifications(result, sessions)

          expect(responsesAndNotifications).to.eql([{
            session: controlSession,
            response: {
              type: 'Response',
              id: 'StartGame',
              success: false,
              details: {
                msg: 'Some error'
              }
            }
          }])
        })
      })

      describe('when the was started', () => {
        it('generates a responses and notifications', () => {
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

