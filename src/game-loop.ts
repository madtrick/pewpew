import {
  IncommingMessage,
  RegisterPlayerMessage,
  RotatePlayerMessage,
  MovePlayerMessage,
  ShootMessage,
  StartGameMessage,
  DeployMineMessage
} from './messages'
import {
  IncommingMessageHandlers,
  SuccessCommandResult,
  SuccessRequestResult,
  FailureRequestResult,
  FailureCommandResult
} from './message-handlers'
import { GameState } from './game-state'
import { Session } from './session'
import movePlayer from './domain/move-player'
import Config from './config'
import { Update } from './domain/state-update-pipeline'

interface GameLoopResult {
  state: GameState
  results: (SuccessCommandResult | SuccessRequestResult | FailureRequestResult | FailureCommandResult)[]
  updates: Update[]
}

/*
 * Notes:
 *
 * - Messages are validated in another layer, before being passed to the loop
 */

 // TODO validate that only one message is processed per player, per loop tick
export type GameLoop = (state: GameState, inputs: { session: Session, message: IncommingMessage<'Request' | 'Command'> }[], config: Config) => Promise<GameLoopResult>

// TODO rename this module to something like message dispatcher
// TODO test the response from the loop function
export default function createGameLopp (
  handlers: IncommingMessageHandlers,
  stateUpdatePipeline: (state: GameState) => Promise<{ state: GameState, updates: Update[] }>
): GameLoop {
  return async function gameLoop (state: GameState, inputs: { session: Session, message: IncommingMessage<'Request' | 'Command'> }[], config: Config): Promise<GameLoopResult> {
    let loopCycleRunResult: GameLoopResult = { state: state, results: [], updates: [] }

    let newState: GameState = state
    let updates: Update[] = []

    if (state.started) {
      const result = await stateUpdatePipeline(state)
      newState = result.state
      updates = result.updates
    }

    // TODO the updates should be returned without being transformed
    // const transformedUpdates = updates.map((update: any) => {
    //   if (update.player) {
    //     return { player: update.player, payload: { data: update.data, sys: 'GameUpdate' } }
    //   }

    //   return undefined
    // }).filter(Boolean)

    // TODO instead of creating a promise here, make the wrapping function async
    return new Promise((resolve) => {
      inputs.forEach(({ session, message }) => {
        const { type: messageType, id: messageId } = message

        if (messageType === 'Request') {
          if (messageId === 'RegisterPlayer') {
            // TODO could I fix the types so I don't have to do the `as ...`
            const result = handlers.Request.RegisterPlayer(session, message as RegisterPlayerMessage, newState, config)
            loopCycleRunResult.results.push(result.result)
          }

          if (messageId === 'MovePlayer') {
            const result = handlers.Request.MovePlayer(session, message as MovePlayerMessage, newState, movePlayer, config)
            loopCycleRunResult.results.push(result.result)
          }

          if (messageId === 'Shoot') {
            const result = handlers.Request.Shoot(session, message as ShootMessage, newState, config)
            loopCycleRunResult.results.push(result.result)
          }

          if (messageId === 'RotatePlayer') {
            const result = handlers.Request.RotatePlayer(session, message as RotatePlayerMessage, newState, config)
            loopCycleRunResult.results.push(result.result)
          }

          if (messageId === 'DeployMine') {
            const result = handlers.Request.DeployMine(session, message as DeployMineMessage, newState, config)
            loopCycleRunResult.results.push(result.result)
          }
        }

        if (messageType === 'Command') {
          if (messageId === 'StartGame') {
            const result = handlers.Command.StartGame(message as StartGameMessage, newState)
            loopCycleRunResult.results.push(result.result)
          }
        }
      })

      loopCycleRunResult.updates = updates

      resolve(loopCycleRunResult)
    })
  }

}
