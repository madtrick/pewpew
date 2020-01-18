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
  FailureCommandResult,
  FailureDeployMineRequest
} from './message-handlers'

function isCommandResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessCommandResult | FailureCommandResult {
  return 'command' in result
}

function isRequestResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessRequestResult | FailureRequestResult | FailureRegisterPlayerRequest {
  return 'request' in result
}

// @ts-ignore TODO remove this ignore
export default function resultToResponseAndNotifications (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult, sessions: Session[]): any[] {
  const controlSession = sessions.find(isControlSession)
  const playerSessions = sessions.filter(isPlayerSession)

  // TODO missing transformation for failed requests or commands

  if (isCommandResult(result)) {
    if (result.success === false && result.command === CommandType.StartGame) {
      const { reason } = result

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
    if (result.success === false && result.request === RequestType.DeployMine) {
      const { session, reason } = result as FailureDeployMineRequest

      return [{
        session,
        response: {
          type: 'Response',
          id: RequestType.DeployMine,
          success: false,
          details: {
            msg: reason
          }
        }
      }]
    }

    if (result.success === true && result.request === RequestType.DeployMine) {
      const { details: { playerId, id, position, remainingMines } } = result
      // TODO isn't the session alredy part of the result? why I'm finding it again here?
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [{
        session: playerSession,
        response: {
          type: 'Response',
          id: RequestType.DeployMine,
          success: true,
          data: {
            mines: remainingMines
          }
        }
      },
      {
        session: controlSession,
        response: {
          type: 'Notification',
          id: RequestType.DeployMine,
          component: {
            type: 'Mine',
            data: {
              playerId,
              id,
              position
            }
          }
        }
      }]
    }

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
      const { details: { id: playerId, position, rotation } } = result
      // TODO isn't the session alredy part of the result? why I'm finding it again here?
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      // TODO I've to type the messages array as any
      // as otherwise I can't add the `JoinGame` notification below
      // because it's shape won't match that of the elements already in the
      // array
      const messages: any = [
        {
          session: controlSession,
          notification: {
            type: 'Notification',
            id: RequestType.RegisterPlayer,
            success: true,
            component: {
              type: 'Player',
              data: {
                id: playerId,
                position,
                rotation
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
              position,
              rotation
            }
          }
        }
      ]

      if (result.details.isGameStarted) {
        messages.push({
          session: playerSession,
          response: {
            type: 'Notification',
            // TODO create enum for notification types
            id: 'JoinGame'
          }
        })
      }

      return messages
    }

    if (result.success === true && result.request === RequestType.MovePlayer) {
      // TODO maybe always include the session in the result so it's easier
      // to find to which user send the response
      const { details: { id: playerId, position } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

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
      const { details: { id: playerId, shots } } = result
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [{
        session: playerSession,
        response: {
          type: 'Response',
          id: RequestType.Shoot,
          success: true,
          data: {
            shots
          }
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
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [
        {
          session: playerSession,
          response: {
            type: 'Response',
            id: RequestType.RotatePlayer,
            success: true,
            data: {
              rotation
            }
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

