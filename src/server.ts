// TODO make MessagingHub, Arena and GameState default exports
import { IMessagingHub, MessagingHub, Message, ChannelRef, WebSocketServer } from './messaging-hub'
import { Arena } from './components/arena'
import { scan } from './components/radar'
import { GameState } from './game-state'
import { handlers } from './message-handlers'
import createGameLopp, { GameLoop }  from './game-loop'
import engine, { Engine, EngineState, createEngineState } from './engine'
import { createSession, CreateSessionFn, createControlSession, CreateControlSessionFn } from './session'
import { createTicker, Ticker } from './ticker'
import * as Logger from 'bunyan'

interface ServerContext {
  logger: Logger
  ticker: Ticker
  engine: Engine
  loop: GameLoop
  engineState: EngineState,
  messaging: {
    control: IMessagingHub
    players: IMessagingHub
  }
  createSession: CreateSessionFn
  createControlSession: CreateControlSessionFn
}

interface Server {
  ticker: Ticker
}

// TODO replace the type returned in this function with InMessage or
// its replacement
function parse (message: Message): { channel: ChannelRef, data: object } | undefined {
  if (!message.data) {
    return
  }

  try {
    return { channel: message.channel, data: JSON.parse(message.data) }
  } catch (_) {
    return
  }
}

export function init ({ WS }: { WS: WebSocketServer }): ServerContext {
  const arena = new Arena({ width: 500, height: 500 }, { radar: scan })
  const gameState = new GameState({ arena })
  const engineState = createEngineState(arena, gameState)
  const ticker = createTicker()
  const loop = createGameLopp(handlers)
  const logger = Logger.createLogger({ name: 'pewpew' })
  const messaging = {
    control: new MessagingHub(new WS({ port: 8888 })),
    players:  new MessagingHub(new WS({ port: 8889 }))
  }

  return {
    logger,
    engineState,
    ticker,
    engine,
    loop,
    messaging,
    createSession,
    createControlSession
  }
}

export function start (context: ServerContext): Server {
  const {
    ticker,
    engine,
    engineState,
    loop,
    messaging,
    createControlSession,
    createSession,
    logger
  } = context

  function isMessage (a: any): a is { channel: ChannelRef, data: object } {
    return a !== undefined
  }

  messaging.control.on('channelOpen', (channel: ChannelRef) => {
    const session = createControlSession(channel)
    engineState.channelSession.set(channel.id, session)
  })

  messaging.players.on('channelOpen', (channel: ChannelRef) => {
    const session = createSession(channel)
    engineState.channelSession.set(channel.id, session)
  })

  ticker.atLeastEvery(100, async () => {
    const controlMessages = messaging.control.pull().map(parse).filter<{channel: ChannelRef, data: object}>(isMessage)
    const playerMessages = messaging.players.pull().map(parse).filter<{channel: ChannelRef, data: object}>(isMessage)
    if (playerMessages.length > 0) {
      logger.info(playerMessages)
    }

    const { playerResultMessages, controlResultMessages } = await engine(engineState, loop, controlMessages, playerMessages, { logger })
    debugger

    for (const message of controlResultMessages) {
      messaging.control.send({ ...message, data: JSON.stringify(message.data) })
    }

    for (const message of playerResultMessages) {
      messaging.players.send({ ...message, data: JSON.stringify(message.data) })
    }
  })

  return {
    ticker
  }
}

// function stop (server: Server): void {

// }
