import { GameState } from '../../game-state'
import { HandlerResult } from '../../message-handlers'
import { RegisterPlayerMessage } from '../../messages'
import { createPlayer } from '../../player'

export default function registerPlayer (message: RegisterPlayerMessage, state: GameState): HandlerResult<void> {
  const player = createPlayer(message.payload.data)
  // const playerExists = state.players().find((player) => player.id === message.payload.data.id)
  // if (playerExists) {
  //   return {
  //     response: {
  //       data: {
  //         result: 'Failure',
  //         msg: `Player already registered with id ${message.payload.data.id}`
  //       },
  //       sys: {
  //         type: 'Response',
  //         id: 'RegisterPlayer'
  //       }
  //     },
  //     state
  //   }
  // }

  // const player = createPlayer(message.payload.data)

  const result = state.registerPlayer(player)

  if (result.status === 'ko') {
    return {
      response: {
        data: {
          result: 'Failure',
          msg: `Player already registered with id ${message.payload.data.id}`
        },
        sys: {
          type: 'Response',
          id: 'RegisterPlayer'
        }
      },
      state
    }
  }

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
