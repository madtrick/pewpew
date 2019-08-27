import { GameState } from '../../game-state'
import { HandlerResult } from '../../message-handlers'
import { RegisterPlayerMessage } from '../../messages'
import { createPlayer } from '../../player'
import { Session } from '../../session'

export default function registerPlayer (session: Session, message: RegisterPlayerMessage, state: GameState): HandlerResult<void> {
  const player = createPlayer(message.data)
  // TODO, maybe check if session.player is already set and reject
  const result = state.registerPlayer(player)

  // TODO another reason for KO could be too many players in the arena
  if (result.status === 'ko') {
    return {
      response: {
        data: {
          result: 'Failure',
          msg: `Player already registered with id ${message.data.id}`
        },
        sys: {
          type: 'Response',
          id: 'RegisterPlayer'
        }
      },
      state
    }
  }

  session.player = result.player

  return {
    response: {
      data: {
        result: 'Success'
      },
      sys: {
        type: 'Response',
        id: 'RegisterPlayer'
      }
    },
    state
  }
}
