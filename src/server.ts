// TODO make MessagingHub, Arena and GameState default exports
import { IMessagingHub, MessagingHub, Message, ChannelRef, WebSocketServerConstructor } from './messaging-hub'
import { Arena } from './components/arena'
import { scan } from './components/radar'
import { GameState } from './game-state'
import { handlers } from './message-handlers'
import createGameLopp, { GameLoop } from './game-loop'
import engine, { Engine, EngineState, createEngineState } from './engine'
import { createSession, CreateSessionFn, createControlSession, CreateControlSessionFn } from './session'
import { createTicker, Ticker } from './ticker'
import { EventType, Event } from './types'
import Config from './config'
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

export function init ({ WS }: { WS: WebSocketServerConstructor }, config: Config): ServerContext {
  const arena = new Arena({ width: 500, height: 500 }, { radar: scan })
  const gameState = new GameState({ arena, started: config.autoStartGame })
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

  let events: Event[] = []

  function isMessage (a: any): a is { channel: ChannelRef, data: object } {
    return a !== undefined
  }

  // TODO for now disable receiving messages from control channels if
  // the game is auto started. For now starting the game is the only reason for
  // the control channel and if that's already handled by the 'autoStartGame'
  // config option, we should limit what can be sent through the channel if
  // it's not needed
  messaging.control.on('channelOpen', (channel: ChannelRef) => {
    const session = createControlSession(channel)
    engineState.channelSession.set(channel.id, session)
    events.push({
      type: EventType.SessionOpen,
      data: session
    })
  })

  messaging.players.on('channelOpen', (channel: ChannelRef) => {
    const session = createSession(channel)
    engineState.channelSession.set(channel.id, session)
  })

  messaging.players.on('channelClose', (channel: ChannelRef) => {
    const session = engineState.channelSession.get(channel.id)

    engineState.channelSession.delete(channel.id)
    events.push({
      type: EventType.SessionClose,
      data: session
    })
  })

  messaging.control.on('channelClose', (channel: ChannelRef) => {
    const session = engineState.channelSession.get(channel.id)

    engineState.channelSession.delete(channel.id)
    events.push({
      type: EventType.SessionClose,
      data: session
    })
  })

  ticker.atLeastEvery(100, async (tick) => {
    const controlMessages = messaging.control.pull().map(parse).filter<{channel: ChannelRef, data: object}>(isMessage)
    const playerMessages = messaging.players.pull().map(parse).filter<{channel: ChannelRef, data: object}>(isMessage)

    const { playerResultMessages, controlResultMessages } = await engine(tick, engineState, loop, controlMessages, playerMessages, events, { logger })

    for (const message of controlResultMessages) {
      // TODO handle exceptions thrown from send
      // TODO group all the promises and do Promise.all instead
      // of await on each one individually
      await messaging.control.send({ ...message, data: JSON.stringify(message.data) })
    }

    for (const message of playerResultMessages) {
      // TODO handle exceptions thrown from send
      // TODO group all the promises and do Promise.all
      // of await on each one individually
      await messaging.players.send({ ...message, data: JSON.stringify(message.data) })
    }

    // TODO could we use the events to also pass messages down to the engine. I mean
    // instead of passing control and player messages, pass a MessageReceived event
    // with objects for both player and control messages
    events = []
  })

  return {
    ticker
  }
}

// function stop (server: Server): void {

// }
