import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../../message-handlers'
import { ShootMessage } from '../../messages'
import { createShot } from '../../shot'

export interface ShootPlayerResultDetails {
  id: string
}

// TODO note that by not havign HandlerResult parameterized with the kind of request result that
// we are supposed to return from here, we could be returning 
export default function shoot (session: Session, _message: ShootMessage, state: GameState): HandlerResult {
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

  if (player.shots === 0) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.Shoot,
        reason: 'There are no shots left'
      },
      state
    }
  }

  const shot = createShot({ player })
  player.shots -= 1
  state.arena.registerShot(shot)

  return {
    result: {
      success: true,
      request: RequestType.Shoot,
      details: {
        id: player.id
      }
    },
    state
  }
}

