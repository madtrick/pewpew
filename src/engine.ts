import { MessagingHub } from './messaging-hub'
import { GameLoop } from './game-loop'
import Config from './config'
import { Arena } from './components/arena'
import { GameState } from './game-state'

export default function engine (loop: GameLoop, messagingHub: MessagingHub, gameStateFactory: (arena: Arena) => GameState, config: Config ) {
  const arena = new Arena({ width: 100, height: 100 })
  const state = gameStateFactory(arena)

  setInterval(() => {
    const messages = messagingHub.pull()
    loop(state, messages)
  }, config.loopDelayInMs)
}
