import { MessagingHub } from './messaging-hub'
import { GameLoop } from './game-loop'
import Config from './config'
import { Arena } from './components/arena'
import { GameState } from './game-state'
import { Session, createSession } from './session'
import { IncommingMessages, validateMessage } from './messages'
import { isFailure, asSuccess, failure, success, Result } from './success-failure'

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

export interface SessionManager {
  createAndSet: (id: string) => Session
  get: (id: string) => Session | undefined
}

export function createSessionManager (): SessionManager {
  const sessions: Map<string, Session> = new Map()

  return {
    createAndSet: (id: string) => {
      const session = createSession()
      sessions.set(id, session)

      return session
    },
    get: (id: string): Session | undefined => {
      return sessions.get(id)
    }
  }
}

export default function engine (loop: GameLoop, messagingHub: MessagingHub, gameStateFactory: (arena: Arena) => GameState, sessionManager: SessionManager, config: Config ): void {
  const arena = new Arena({ width: 100, height: 100 })
  const state = gameStateFactory(arena)

  setInterval(() => {
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
        let session = sessionManager.get(channel.id)

        if (!session) {
          session = sessionManager.createAndSet(channel.id)
        }

        parsedMessages.push({ session, message: asSuccess(result) })
      }
    }

    errors.forEach((e) => messagingHub.send(e))

    loop(state, parsedMessages)
  }, config.loopDelayInMs)
}
