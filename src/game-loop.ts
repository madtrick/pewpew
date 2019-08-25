import {
  IncommingMessage,
  RegisterPlayerMessage,
  MovePlayerMessage,
  ShootMessage,
  StartGameMessage,
  OutgoingMessage,
  UpdateMessage
} from './messages'
import { IncommingMessageHandlers } from './message-handlers'
import { GameState } from './game-state'
import { Session } from './session'

interface GameLoopResult {
  state: GameState
  responses: OutgoingMessage<any>[]
  updates: UpdateMessage[]
}

/*
 * Notes:
 *
 * - Messages are validated in another layer, before being passed to the loop
 */

 // TODO validate that only one message is processed per player, per loop tick
export type GameLoop = (state: GameState, inputs: { session: Session, message: IncommingMessage<'Request' | 'Command'> }[]) => Promise<GameLoopResult>

export default function createGameLopp (handlers: IncommingMessageHandlers): GameLoop {
  return function gameLoop (state: GameState, inputs: { session: Session, message: IncommingMessage<'Request' | 'Command'> }[]): Promise<GameLoopResult> {
    let loopCycleRunResult: GameLoopResult = { state: state, responses: [], updates: [] }

    // TODO instead of creating a promise here, make the wrapping function async
    return new Promise((resolve) => {
      inputs.forEach(({ session, message }) => {
        const { sys: { type: messageType, id: messageId } } = message

        if (messageType === 'Request') {
          if (messageId === 'RegisterPlayer') {
            // TODO could I fix the types so I don't have to do the `as ...`
            const result = handlers.Request.RegisterPlayer(session, message as RegisterPlayerMessage, state)

            if (result.response) {
              loopCycleRunResult.responses.push(result.response)
            }
          }

          if (messageId === 'MovePlayer') {
            handlers.Request.MovePlayer(session, message as MovePlayerMessage, state)
          }

          if (messageId === 'Shoot') {
            handlers.Request.Shoot(session, message as ShootMessage, state)
          }
        }

        if (messageType === 'Command') {
          if (messageId === 'StartGame') {
            handlers.Command.StartGame(message as StartGameMessage, state)
          }
        }
      })

      const updates = state.update()
      const transformedUpdates = updates.map((update: any) => {
        if (update.player) {
          return { player: update.player, payload: { data: update.data, sys: 'GameUpdate' } }
        }

        return undefined
      }).filter(Boolean)

      loopCycleRunResult.updates = transformedUpdates

      resolve(loopCycleRunResult)
    })
  }

}
