import { GameState } from '../../game-state'
import { HandlerResult } from '../../message-handlers'
import { RegisterPlayerMessage } from '../../messages'
import { Player } from '../../game-loop'

function createPlayer (data: { id: string }): Player {
  return { id: data.id }
}

export default function registerPlayer (message: RegisterPlayerMessage, state: GameState): HandlerResult {
  const playerExists = state.players.find((player) => player.id === message.data.id)
  if (playerExists) {
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

  const player = createPlayer(message.data)

  state.players.push(player)

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
