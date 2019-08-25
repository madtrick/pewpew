import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult } from '../../message-handlers'
import { ShootMessage } from '../../messages'
import { createShot } from '../../shot'

export default function shoot (session: Session, _message: ShootMessage, state: GameState): HandlerResult<void> {
  if (!state.started) {
    return {
      response: {
        data: {
          result: 'Failure',
          msg: 'The game has not started'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      },
      state
    }
  }

  const { player } = session

  if (!player) {
    return {
      response: {
        data: {
          result: 'Failure',
          msg: 'There is no player registered for this session'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      },
      state
    }
  }

  if (player.shots === 0) {
    return {
      response: {
        data: {
          result: 'Failure',
          msg: 'There are no shots left'
        },
        sys: {
          type: 'Response',
          id: 'Shoot'
        }
      },
      state
    }
  }

  const shot = createShot({ player })
  player.shots -= 1
  state.arena.registerShot(shot)

  return {
    response: {
      data: {
        result: 'Success'
      },
      sys: {
        type: 'Response',
        id: 'Shoot'
      }
    },
    state
  }
}

