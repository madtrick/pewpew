// TODO make MessagingHub, Arena and GameState default exports
import uuid from 'uuid/v4'
import { MessagingHub, WebSocketMessagingHub, Message, ChannelRef, RouteRef, WebSocketConnectionHandler } from './messaging-hub'
import { Arena } from './components/arena'
import { scan } from './components/radar'
import { GameState } from './game-state'
import { handlers } from './message-handlers'
import createGameLoop, { GameLoop } from './game-loop'
import engine, { Engine, EngineState, createEngineState } from './engine'
import { createSession, CreateSessionFn, createControlSession, CreateControlSessionFn } from './session'
import { createProcessor as createMoveShotPipelineProcessor } from './domain/state-processors/move-shot'
import { createProcessor as createMineHitPipelineProcessor } from './domain/state-processors/mine-hit'
import { createProcessor as createShotHitPipelineProcessor } from './domain/state-processors/shot-hits'
import { createProcessor as createRadarScanPipelineProcessor } from './domain/state-processors/radar-scan'
import { createTicker, Ticker } from './ticker'
import { EventType, Event } from './types'
import Config from './config'
import * as Logger from 'bunyan'
import { process, Update } from './domain/state-update-pipeline'

interface ServerContext {
  config: Config
  logger: Logger
  ticker: Ticker
  engine: Engine
  loop: GameLoop
  engineState: EngineState
  messagingHub: MessagingHub
  createSession: CreateSessionFn
  createControlSession: CreateControlSessionFn
}

export interface Server {
  ticker: Ticker
}

// TODO replace the type returned in this function with InMessage or
// its replacement
function parse (message: Message): { channel: ChannelRef, route: RouteRef, data: object } | undefined {
  if (!message.data) {
    return
  }

  try {
    return { channel: message.channel, route: message.route, data: JSON.parse(message.data) }
  } catch (_) {
    return
  }
}

export const ARENA_WIDTH = 500
export const ARENA_HEIGHT = 500

export function init ({ WS }: { WS: WebSocketConnectionHandler }, config: Config): ServerContext {
  const arena = new Arena({ width: ARENA_WIDTH, height: ARENA_HEIGHT })
  const gameState = new GameState({ arena, started: config.autoStartGame })
  const engineState = createEngineState(arena, gameState)
  const ticker = createTicker()
  const statePipeline = [
    createMoveShotPipelineProcessor(config.movementSpeeds.shot),
    createShotHitPipelineProcessor({ width: arena.width, height: arena.height }),
    createMineHitPipelineProcessor(),
    createRadarScanPipelineProcessor(scan)
  ]
  const statePipelineProcessor = (state: GameState): Promise<{ state: GameState, updates: Update[] }> => process(statePipeline, state)
  const loop = createGameLoop(handlers, statePipelineProcessor)
  const logger = Logger.createLogger({ name: 'pewpew', level: 'info' })
  const messagingRoutes = {
    '/ws/player': { id: 'player' },
    '/ws/control': { id: 'control' }
  }
  const messagingHub = new WebSocketMessagingHub(WS, uuid, { routes: messagingRoutes })

  return {
    config,
    logger,
    engineState,
    ticker,
    engine,
    loop,
    messagingHub,
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
    messagingHub,
    createControlSession,
    createSession,
    logger,
    config
  } = context

  let events: Event[] = []

  function isMessage (a: any): a is { channel: ChannelRef, route: RouteRef, data: object } {
    return a !== undefined
  }

  // TODO for now disable receiving messages from control channels if
  // the game is auto started. For now starting the game is the only reason for
  // the control channel and if that's already handled by the 'autoStartGame'
  // config option, we should limit what can be sent through the channel if
  // it's not needed
  messagingHub.on('channelOpen', (channel: ChannelRef, context: { route: RouteRef }) => {
    if (context.route.id === 'control') {
      logger.info('Create control session')
      const session = createControlSession(channel)
      engineState.channelSession.set(channel.id, session)
      events.push({
        type: EventType.SessionOpen,
        data: session
      })
    }

    if (context.route.id === 'player') {
      logger.info('Create player session')
      const session = createSession(channel)
      engineState.channelSession.set(channel.id, session)
    }
  })

  messagingHub.on('channelClose', (channel: ChannelRef) => {
    const session = engineState.channelSession.get(channel.id)

    if (!session) {
      return
    }

    logger.info(`Close session (${session.type})`)

    engineState.channelSession.delete(channel.id)
    events.push({
      type: EventType.SessionClose,
      data: session
    })
  })

  ticker.atLeastEvery(100, async () => {
    const messages = messagingHub.pull().map(parse).filter<{channel: ChannelRef, route: RouteRef, data: object}>(isMessage)
    const controlMessages = messages.filter((message) => message.route.id === 'control')
    const playerMessages = messages.filter((message) => message.route.id === 'player')

    const { playerResultMessages, controlResultMessages } = await engine(engineState, loop, controlMessages, playerMessages, events, { logger, config })

    for (const message of [...controlResultMessages, ...playerResultMessages]) {
      // TODO handle exceptions thrown from send
      // TODO group all the promises and do Promise.all instead
      // of await on each one individually
      await messagingHub.send({ ...message, data: JSON.stringify(message.data) })
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

export async function stop (server: Server): Promise<void> {
  server.ticker.cancel()
}
