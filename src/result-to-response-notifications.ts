import { Session, isControlSession, isPlayerSession } from './session'
import {
  RequestType,
  CommandType,
  SuccessRequestResult,
  SuccessCommandResult,
  FailureRequestResult,
  FailureRegisterPlayerRequest,
  FailureShootRequest,
  FailureMoveRequest,
  FailureCommandResult
} from './message-handlers'

function isCommandResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessCommandResult | FailureCommandResult {
  return 'command' in result
}

function isRequestResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessRequestResult | FailureRequestResult | FailureRegisterPlayerRequest {
  return 'request' in result
}

export default function resultToResponseAndNotifications (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult, sessions: Session[]): any[] {
  const controlSession = sessions.find(isControlSession)
  const playerSessions = sessions.filter(isPlayerSession)

  // TODO missing transformation for failed requests or commands

  if (isCommandResult(result)) {
    if (result.success === false && result.command === CommandType.StartGame) {
      const { reason } = result as FailureCommandResult

      return [{
        session: controlSession,
        response: {
          type: 'Response',
          id: CommandType.StartGame,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }
    if (result.success === true && result.command === CommandType.StartGame) {
      return [
        {
          session: controlSession,
          response: {
            type: 'Response',
            id: CommandType.StartGame,
            success: true
          }
        },
        ...playerSessions.map((playerSession) => ({
          session: playerSession,
          notification: {
            type: 'Notification',
            id: CommandType.StartGame
          }
        }))
      ]
    }
  }

  if (isRequestResult(result)) {
    if (result.success === false && result.request === RequestType.RegisterPlayer) {
      const { session, reason } = result as FailureRegisterPlayerRequest

      return [{
        session,
        response: {
          type: 'Response',
          id: RequestType.RegisterPlayer,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }

    if (result.success === true && result.request === RequestType.RegisterPlayer) {
      const { details: { id: playerId, position } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [{
        session: controlSession,
        notification: {
          type: 'Notification',
          id: RequestType.RegisterPlayer,
          success: true,
          component: {
            type: 'Player',
            data: {
              // TODO remove the hardcoded player id
              id: 'player-1',
              // TODO remove this hardcoded value
              // TODO missing rotation
              position: {
                x: 100,
                y: 100
              }
            }
          }
        }
      },
      {
        session: playerSession,
        response: {
          type: 'Response',
          id: RequestType.RegisterPlayer,
          success: true,
          details: {
            position
          }
        }
      }]
    }

    if (result.success === true && result.request === RequestType.MovePlayer) {
      // TODO maybe always include the session in the result so it's easier
      // to find to which user send the response
      const { details: { id: playerId, position } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [
        {
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.MovePlayer,
            success: true,
            details: {
              position
            }
          }
        },
        {
          session: controlSession,
          response: {
            type: 'Notification',
            id: 'Movement',
            component: {
              type: 'Player',
              data: {
                id: playerId,
                position
              }
            }
          }
        }
      ]
    }

    if (result.success === false && result.request === RequestType.MovePlayer) {
      const { session, reason } = result as FailureMoveRequest

      return [{
        session,
        response: {
          type: 'Response',
          id: RequestType.MovePlayer,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }

    if (result.success === true && result.request === RequestType.Shoot) {
      const { details: { id: playerId } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [{
        session: playerSession,
        response: {
          type: 'Response',
          id: RequestType.Shoot,
          success: true
        }
      }]
    }

    if (result.success === false && result.request === RequestType.Shoot) {
      const { session, reason } = result as FailureShootRequest

      return [{
        session: session,
        response: {
          type: 'Response',
          id: RequestType.Shoot,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }

    if (result.success === true && result.request === RequestType.RotatePlayer) {
      const { details: { id: playerId, rotation } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [
        {
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.RotatePlayer,
            success: true
          }
        },
        {
          session: controlSession,
          response: {
            type: 'Notification',
            // TODO: what is this `ComponentUpdate` id? We are using `MovePlayer` when a player was moved
            id: 'ComponentUpdate',
            component: {
              type: 'Player',
              data: {
                id: playerId,
                rotation
              }
            }
          }

        }
      ]
    }

    if (result.success === false && result.request === RequestType.RotatePlayer) {
      const { session, reason } = result as FailureShootRequest

      return [{
        session: session,
        response: {
          type: 'Response',
          id: RequestType.RotatePlayer,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }
  }

}

