import { GameLoop } from './game-loop'
import { Arena } from './components/arena'
import { GameState } from './game-state'
import { Session, isPlayerSession } from './session'
import { IncommingMessages, validateMessage } from './messages'
import { isFailure, asSuccess, failure, success, Result } from './success-failure'
import updateToNotifications from './update-to-notifications'
import resultToResponseAndNotifications from './result-to-response-notifications'
import { ILogger } from './types'

function asIncomingMessage (message: object): Result<IncommingMessages, any> {
  // let object: object

  // TODO move this logic outside of the engine
  // if (typeof message !== 'string') {
  //   return failure('non string payload')
  // }

  // try {
  //   object = JSON.parse(message)
  // } catch (_e) {
  //   return failure('invalid json')
  // }

  if (validateMessage(message)) {
    // TODO IncommingMessages only covers Requests
    return success(message as IncommingMessages)
  } else {
    return failure('non schema compliant')
  }
}

interface OutMessage {
  channel: { id: string }
  data: object
}

interface InMessage {
  channel: { id: string }
  data: object
}

export interface EngineState {
  gameState: GameState
  arena: Arena
  channelSession: Map<string, Session>
  sessionChannel: Map<Session, string>
}

interface EngineResult {
  playerResultMessages: OutMessage[]
  controlResultMessages: OutMessage[]
}

export function createEngineState (arena: Arena, gameState: GameState): EngineState {
  return {
    gameState,
    arena,
    channelSession: new Map(),
    sessionChannel: new Map()
  }
}

// TODO create a module that takes messages from the messaging hub and parses and ensures that they are objects
// TODO rather than reimplementing the type here use `typeof engine`
export type Engine = (
  state: EngineState,
  loop: GameLoop,
  controlMessages: InMessage[],
  messages: InMessage[],
  context: { logger: ILogger }
) => Promise<EngineResult>
export default async function engine (
  state: EngineState,
  loop: GameLoop,
  controlMessages: InMessage[],
  messages: InMessage[],
  context: { logger: ILogger }
): Promise<EngineResult> {
  const parsedMessages: { session: Session, message: IncommingMessages }[] = []
  const controlResultMessages: OutMessage[] = []
  const playerResultMessages: OutMessage[] = []

  // TODO validate that only requests come in these messages
  // and not commands
  for (const { channel, data } of messages) {
    const result = asIncomingMessage(data)

    if (isFailure(result)) {
      playerResultMessages.push({
        channel,
        data: {
          type: 'Error',
          details: {
            // TODO include the details from the failure
            msg: 'Invalid message'
          }
        }
      })
    } else {
      context.logger.info({ msg: result })
      const session = state.channelSession.get(channel.id)

      if (session) {
        parsedMessages.push({ session, message: asSuccess(result) })
      } else {
        // This should not be possible. We should instead pass the session
        // together with the message
      }
    }
  }

  for (const { channel, data } of controlMessages) {
    const result = asIncomingMessage(data)

    if (isFailure(result)) {
      controlResultMessages.push({
        channel,
        data: {
          type: 'Error',
          details: {
            // TODO include the details from the failure
            msg: 'Invalid message'
          }
        }
      })
    } else {
      const session = state.channelSession.get(channel.id)

      if (session) {
        parsedMessages.push({ session, message: asSuccess(result) })
      } else {
        // This should not be possible. We should instead pass the session
        // together with the message
      }
    }
  }

  const { updates, results } = await loop(state.gameState, parsedMessages)

  // TODO combine the notifications and responses
  if (results) {
    for (const result of results) {
      const responsesAndNotifications = resultToResponseAndNotifications(result, Array.from(state.channelSession.values()))
      for (const notification of responsesAndNotifications) {
        const channelId = state.sessionChannel.get(notification.session)

        if (channelId) {
          if (isPlayerSession(notification.session)) {
            playerResultMessages.push({ channel: { id: channelId }, data: notification.notification || notification.response })
          } else {
            controlResultMessages.push({ channel: { id: channelId }, data: notification.notification || notification.response })
          }
        } else {
          // TODO log
        }
      }
    }
  }

  if (updates) {
    for (const update of updates) {
      const notifications = updateToNotifications(update, Array.from(state.channelSession.values()))

      for (const notification of notifications) {
        const channelId = state.sessionChannel.get(notification.session)

        if (channelId) {
          if (isPlayerSession(notification.session)) {
            playerResultMessages.push({ channel: { id: channelId }, data: notification.notification })
          } else {
            controlResultMessages.push({ channel: { id: channelId }, data: notification.notification })
          }
        } else {
          // TODO log
        }
      }
    }
  }

  // TODO rename this properties
  return { playerResultMessages, controlResultMessages }
}
