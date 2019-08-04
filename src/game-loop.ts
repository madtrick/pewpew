import { IncommingMessage, RegisterPlayerMessage, StartGameMessage, OutgoingMessage } from './messages'
import { IncommingMessageHandlers } from './message-handlers'
import { GameState } from './game-state'

interface GameLoopResult {
  state: GameState
  responses: OutgoingMessage<any>[]
}

/*
 * Notes:
 *
 * - Messages are validated in another layer, before being passed to the loop
 */
type GameLoop = (state: GameState, messages: IncommingMessage<'Request' | 'Command'>[]) => Promise<GameLoopResult>
export default function createGameLopp (handlers: IncommingMessageHandlers): GameLoop {
  return function gameLoop (state: GameState, messages: IncommingMessage<'Request' | 'Command'>[]): Promise<GameLoopResult> {
    let loopCycleRunResult: GameLoopResult = { state: state, responses: [] }

    return new Promise((resolve) => {
      messages.forEach((message) => {
        const { payload: { sys: { type: messageType, id: messageId } } } = message

        if (messageType === 'Request') {
          if (messageId === 'RegisterPlayer') {
            const result = handlers.Request.RegisterPlayer(message as RegisterPlayerMessage, state)

            if (result.response)
              loopCycleRunResult.responses.push(result.response)
          }
        }

        if (messageType === 'Command') {
          if (messageId === 'StartGame') {
            handlers.Command.StartGame(message as StartGameMessage, state)
          }
        }


        resolve(loopCycleRunResult)
      })
    })
  }

}
