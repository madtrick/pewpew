import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../../message-handlers'
import { ShootMessage } from '../../messages'
import { createShot } from '../../shot'
import Config from '../../config'

export interface ShootPlayerResultDetails {
  id: string
  remainingTokens: number
  requestCostInTokens: number
}

// TODO note that by not havign HandlerResult parameterized with the kind of request result that
// we are supposed to return from here, we could be returning
export default function shoot (session: Session, _message: ShootMessage, state: GameState, config: Config): HandlerResult {
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.Shoot,
        reason: 'The game has not started'
      },
      state
    }
  }

  const { playerId } = session

  if (!playerId) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.Shoot,
        reason: 'There is no player registered for this session'
      },
      state
    }
  }

  const player = state.arena.findPlayer(playerId)

  if (!player) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.Shoot,
        reason: 'The player could not be found'
      },
      state
    }
  }

  const playerShotCostInToken = config.costs.playerShot

  if (player.tokens < playerShotCostInToken) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.Shoot,
        reason: 'Not enough tokens to fire a shot'
      },
      state
    }
  }

  const shot = createShot({ player })
  player.tokens = player.tokens - playerShotCostInToken
  // TODO handle result. Return an error if the result is not 'ok'
  state.arena.registerShot(shot)

  return {
    result: {
      session,
      success: true,
      request: RequestType.Shoot,
      details: {
        requestCostInTokens: playerShotCostInToken,
        remainingTokens: player.tokens,
        id: player.id
      }
    },
    state
  }
}

