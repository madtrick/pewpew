import { Session, isControlSession, isPlayerSession, ControlSession } from './session'
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
import Config from './config'
import { ARENA_WIDTH, ARENA_HEIGHT } from './server'
import { PLAYER_RADIUS } from './player'
import { RADAR_RADIUS } from './components/radar'

function isCommandResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessCommandResult | FailureCommandResult {
  return 'command' in result
}

function isRequestResult (result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult): result is SuccessRequestResult | FailureRequestResult | FailureRegisterPlayerRequest {
  return 'request' in result
}

export default function resultToResponseAndNotifications (
  result: SuccessRequestResult | SuccessCommandResult | FailureRequestResult | FailureCommandResult,
  sessions: Session[],
  config: Config
): ({ session: Session, payload: any } | { session: ControlSession, payload: any })[] {
  const controlSessions = sessions.filter(isControlSession)
  const playerSessions = sessions.filter(isPlayerSession)

  // TODO missing transformation for failed requests or commands

  if (isCommandResult(result)) {
    if (result.success === false && result.command === CommandType.StartGame) {
      const { reason } = result

      return controlSessions.map((controlSession) => ({
        session: controlSession,
        payload: {
          type: 'Response',
          id: CommandType.StartGame,
          success: false,
          details: {
            msg: reason
          }
        }
      }))
    }
    if (result.success === true && result.command === CommandType.StartGame) {
      return [
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          payload: {
            type: 'Response',
            id: CommandType.StartGame,
            success: true
          }
        })),
        ...playerSessions.map((playerSession) => ({
          session: playerSession,
          payload: {
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
        payload: {
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
      const { session: playerSession, details: { playerId, id, position, remainingTokens, requestCostInTokens } } = result

      return [
        {
          session: playerSession,
          payload: {
            type: 'Response',
            id: RequestType.DeployMine,
            success: true,
            data: {
              component: {
                details: {
                  tokens: remainingTokens
                }
              },
              request: {
                cost: requestCostInTokens
              }
            }
          }
        },
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          payload: {
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
        }))
      ]
    }

    if (result.success === false && result.request === RequestType.RegisterPlayer) {
      const { session, reason } = result as FailureRegisterPlayerRequest

      return [{
        session,
        payload: {
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
      const { session: playerSession, details: { id: playerId, position, rotation, gameVersion, tokens, life } } = result

      // TODO I've to type the messages array as any
      // as otherwise I can't add the `JoinGame` notification below
      // because it's shape won't match that of the elements already in the
      // array
      const messages: any = [
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          payload: {
            type: 'Notification',
            id: RequestType.RegisterPlayer,
            success: true,
            component: {
              type: 'Player',
              data: {
                id: playerId,
                position,
                rotation,
                life,
                tokens
              }
            }
          }
        })),
        {
          session: playerSession,
          payload: {
            type: 'Response',
            id: RequestType.RegisterPlayer,
            success: true,
            details: {
              game: {
                version: gameVersion
              },
              position,
              rotation,
              life,
              tokens
            }
          }
        }
      ]

      if (result.details.isGameStarted) {
        messages.push({
          session: playerSession,
          payload: {
            type: 'Notification',
            // TODO create enum for notification types
            id: 'JoinGame',
            details: {
              game: {
                settings: {
                  playerSpeed: config.movementSpeeds.player,
                  shotSpeed: config.movementSpeeds.shot,
                  turboMultiplier: config.turboMultiplierFactor,
                  arenaWidth: ARENA_WIDTH,
                  arenaHeight: ARENA_HEIGHT,
                  playerRadius: PLAYER_RADIUS,
                  radarScanRadius: RADAR_RADIUS
                }
              }
            }
          }
        })
      }

      return messages
    }

    if (result.success === true && result.request === RequestType.MovePlayer) {
      // TODO maybe always include the session in the result so it's easier
      // to find to which user send the response
      const { session: playerSession, details: { id: playerId, position, remainingTokens, requestCostInTokens, turboApplied } } = result

      return [
        {
          session: playerSession,
          payload: {
            type: 'Response',
            id: RequestType.MovePlayer,
            success: true,
            data: {
              component: {
                details: {
                  tokens: remainingTokens,
                  position
                }
              },
              request: {
                withTurbo: turboApplied,
                cost: requestCostInTokens
              }
            }
          }
        },
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          payload: {
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
        }))
      ]
    }

    if (result.success === false && result.request === RequestType.MovePlayer) {
      const { session, reason } = result as FailureMoveRequest

      return [{
        session,
        payload: {
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
      const { session: playerSession, details: { remainingTokens: remainingTokens, requestCostInTokens } } = result

      return [{
        session: playerSession,
        payload: {
          type: 'Response',
          id: RequestType.Shoot,
          success: true,
          data: {
            component: {
              details: {
                tokens: remainingTokens
              }
            },
            request: {
              cost: requestCostInTokens
            }
          }
        }
      }]
    }

    if (result.success === false && result.request === RequestType.Shoot) {
      const { session, reason } = result as FailureShootRequest

      return [{
        session: session,
        payload: {
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
      const { session: playerSession, details: { id: playerId, rotation, remainingTokens, requestCostInTokens } } = result

      return [
        {
          session: playerSession,
          payload: {
            type: 'Response',
            id: RequestType.RotatePlayer,
            success: true,
            data: {
              component: {
                details: {
                  rotation,
                  tokens: remainingTokens
                }
              },
              request: {
                cost: requestCostInTokens
              }
            }
          }
        },
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          payload: {
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

        }))
      ]
    }

    if (result.success === false && result.request === RequestType.RotatePlayer) {
      const { session, reason } = result as FailureShootRequest

      return [{
        session: session,
        payload: {
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

  return []
}

