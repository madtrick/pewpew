import * as WS from 'ws'
// TODO make MessagingHub, Arena and GameState default exports
import { MessagingHub } from './messaging-hub'
import { Arena } from './components/arena'
import { GameState } from './game-state'
import { handlers } from './message-handlers'
import createGameLopp from './game-loop'
import { Engine, createEngineState } from './engine'
import { createSession } from './session'
import { createTicker } from './ticker'

// TODO test this
export function createServer (engine: Engine) {
  const WSServer = new WS.Server({ port: 8888 })
  const messaging = new MessagingHub(WSServer)
  const arena = new Arena ({ width: 500, height: 500 })
  const gameState = new GameState({ arena })
  const gameLoop = createGameLopp(handlers)
  const engineState = createEngineState(arena, gameState)
  const ticker = createTicker()

  ticker.atLeastEvery(100, () => {
    const messages = messaging.pull()
    return engine(engineState, gameLoop, messages, createSession)
  })
}
