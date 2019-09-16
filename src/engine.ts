import { MessagingHub } from './messaging-hub'
import { GameLoop } from './game-loop'
import { Arena } from './components/arena'
import { GameState } from './game-state'
import { Session, CreateSessionFn } from './session'
import { IncommingMessages, validateMessage } from './messages'
import { isFailure, asSuccess, failure, success, Result } from './success-failure'
import updateToNotifications from './update-to-notifications'
import resultToResponseAndNotifications from './result-to-response-notifications'

function parseMessage (message: unknown): Result<IncommingMessages, any> {
  let object: object

  if (typeof message !== 'string') {
    return failure('non string payload')
  }

  try {
    object = JSON.parse(message)
  } catch (_e) {
    return failure('invalid json')
  }

  if (validateMessage(object)) {
    // TODO IncommingMessages only covers Requests
    return success(object as IncommingMessages)
  } else {
    return failure('non schema compliant')
  }
}

export interface EngineState {
  gameState: GameState
  arena: Arena
  channelSession: Map<string, Session>
  sessionChannel: Map<Session, string>
}

export function createEngineState (arena: Arena, gameState: GameState): EngineState {
  return {
    gameState,
    arena,
    channelSession: new Map(),
    sessionChannel: new Map()
  }
}

export type Engine = (state: EngineState, loop: GameLoop, messagingHub: MessagingHub, createSession: CreateSessionFn) => Promise<void>
// TODO remove the config object
export default async function engine (state: EngineState, loop: GameLoop, messagingHub: MessagingHub, createSession: CreateSessionFn): Promise<void> {
  const messages = messagingHub.pull()
  const parsedMessages: { session: Session, message: IncommingMessages }[] = []
  const errors = []

  for (const { channel, data } of messages) {
    const result = parseMessage(data)

    if (isFailure(result)) {
      errors.push({
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
      let session = state.channelSession.get(channel.id)

      if (!session) {
        // TODO cleanup after a channel is closed
        session = createSession()
        state.channelSession.set(channel.id, session)
        state.sessionChannel.set(session, channel.id)
      }

      parsedMessages.push({ session, message: asSuccess(result) })
    }
  }

  // TODO missing await on the call to `send`
  errors.forEach((e) => messagingHub.send(e))

  const { updates, results } = await loop(state.gameState, parsedMessages)

  // TODO combine the notifications and responses
  if (results) {
    for (const result of results) {
      const responsesAndNotifications = resultToResponseAndNotifications(result, Array.from(state.channelSession.values()))
      for (const notification of responsesAndNotifications) {
        // TODO missing await on the call to `send`
        const channelId = state.sessionChannel.get(notification.session)

        if (channelId) {
          messagingHub.send({ channel: { id: channelId }, data: notification.notification || notification.response })
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
        // TODO missing await on the call to `send`
        messagingHub.send({ channel: { id: 'channel-1' }, data: notification.notification })
      }
    }
  }
}
