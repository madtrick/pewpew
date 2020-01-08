import { GameLoop } from './game-loop'
import { Arena, UpdateType, ComponentType } from './components/arena'
import { GameState } from './game-state'
import { Session, isPlayerSession, isControlSession } from './session'
import { IncommingMessages, validateMessage } from './messages'
import { isFailure, asSuccess, failure, success, Result } from './success-failure'
import updateToNotifications, { ComponentUpdate } from './update-to-notifications'
import resultToResponseAndNotifications from './result-to-response-notifications'
import { ILogger, Event, EventType, Position, Rotation } from './types'

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

interface GameStateInitNotification {
  type: 'Notification'
  id: 'GameStateInit'
  data: {
    players: {
      id: string
      position: Position
      rotation: Rotation
      life: number
    }[]
    shots: {
      id: string
      position: Position
      rotation: Rotation
    }[]
    mines: {
      id: string
      position: Position
    }[]
    isGameStarted: boolean
  }
}

export function createEngineState (arena: Arena, gameState: GameState): EngineState {
  return {
    gameState,
    arena,
    channelSession: new Map(),
    // TODO remove this property, is no longer used
    sessionChannel: new Map()
  }
}

// TODO create a module that takes messages from the messaging hub and parses and ensures that they are objects
// TODO rather than reimplementing the type here use `typeof engine`
export type Engine = typeof engine
export default async function engine (
  currentTick: number,
  state: EngineState,
  loop: GameLoop,
  controlMessages: InMessage[],
  messages: InMessage[],
  events: Event[],
  context: { logger: ILogger }
): Promise<EngineResult> {
  const parsedMessages: { session: Session, message: IncommingMessages }[] = []
  const controlResultMessages: OutMessage[] = []
  const playerResultMessages: OutMessage[] = []

  // TODO move all the event handling logic to a separa module so it's easier to test
  for (const event of events) {
    debugger
    if (event.type === EventType.SessionOpen) {
      if (event.data && isControlSession(event.data)) {
        if (state.gameState.started) {
          const players = state.gameState.arena.players().map((player) => {
            return {
              id: player.id,
              position: player.position,
              rotation: player.rotation,
              life: player.life
            }
          })
          const shots = state.gameState.arena.shots().map((shot) => {
            return {
              id: shot.id,
              position: shot.position,
              rotation: shot.rotation
            }
          })
          const mines = state.gameState.arena.mines.map((mine) => {
            return {
              id: mine.id,
              position: mine.position
            }
          })

          const update: GameStateInitNotification = {
            type: 'Notification',
            id: 'GameStateInit',
            data: {
              players,
              shots,
              mines,
              isGameStarted: state.gameState.started
            }
          }

          // TODO piggybacking on the array that contains the results to be send to the
          // control sessions
          controlResultMessages.push({ channel: event.data.channel, data: update })
        }
      }
    } else if (event.type === EventType.SessionClose) {
      const player = state.gameState.players().find((player) => player.id === event.data.playerId)
      if (player) {
        const result = state.gameState.removePlayer(player)

        if (result.status === 'ok') {
          const update: ComponentUpdate = {
            type: UpdateType.RemovePlayer,
            component: {
              type: ComponentType.Player,
              data: {
                id: player.id
              }
            }
          }

          const [notification] = updateToNotifications(update, Array.from(state.channelSession.values()))
          // TODO adding this GameStateUpdate here and also at the bottom of this file is a mess
          // fix the GameStateUpdate message generation
          controlResultMessages.push({
            channel: notification.session.channel,
            data: {
              type: 'Notification',
              id: 'GameStateUpdate',
              data: [notification.notification]
            }
          })
        }
      }
    }
  }

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
      // TODO sessions shouldn't be a part of the engine state. Instead they should be
      // passed as a separate argument
      const session = state.channelSession.get(channel.id)

      if (session) {
        parsedMessages.push({ session, message: asSuccess(result) })
      } else {
        // This should not be possible. We should instead pass the session
        // together with the message
      }
    }
  }

  const { updates, results } = await loop(currentTick, state.gameState, parsedMessages)
  const dataForChannel = new Map()

  // TODO combine the notifications and responses
  if (results) {
    for (const result of results) {
      const responsesAndNotifications = resultToResponseAndNotifications(result, Array.from(state.channelSession.values()))
      for (const notification of responsesAndNotifications) {
        const session = notification.session

        if (!session) {
          // TODO one of the case I'm aware when there won't be a session
          // is when the game has started but there's no control session attached yet.
          // The game should continue running even on that case so for now just
          // bail early to avoid 'Cannot read property 'channel' of undefined'
          // errors
          //
          // Ideally we shouldn't have the notifications being generated in the first place
          //
          continue
        }

        const channel = session.channel

        if (isPlayerSession(notification.session)) {
          // TODO we shoult pass the session here and not the channel. The channel is an implementation
          // detail of how we communicate with players
          playerResultMessages.push({ channel, data: notification.notification || notification.response })
        } else {
          // controlResultMessages.push({ channel, data: notification.notification || notification.response })
          if (dataForChannel.has(channel)) {
            dataForChannel.get(channel).push(notification.notification || notification.response)
          } else {
            dataForChannel.set(channel, [notification.notification || notification.response])
          }
        }
      }
    }
  }

  if (updates) {
    for (const update of updates) {
      const notifications = updateToNotifications(update, Array.from(state.channelSession.values()))

      for (const notification of notifications) {
        const session = notification.session

        if (!session) {
          // TODO one of the case I'm aware when there won't be a session
          // is when the game has started but there's no control session attached yet.
          // The game should continue running even on that case so for now just
          // bail early to avoid 'Cannot read property 'channel' of undefined'
          // errors
          //
          // Ideally we shouldn't have the notifications being generated in the first place
          //
          continue
        }

        const channel = session.channel

        if (isPlayerSession(notification.session)) {
          playerResultMessages.push({ channel, data: notification.notification })
        } else {
          // controlResultMessages.push({ channel, data: notification.notification })
          if (dataForChannel.has(channel)) {
            dataForChannel.get(channel).push(notification.notification)
          } else {
            dataForChannel.set(channel, [notification.notification])
          }
        }
      }
    }
  }

  /*
   * NOTE combining the results and notifications here was done
   * as a way to take load away from the UI. Sending one message per
   * shot movement or player request was too much for the UI.
   *
   *
   * There are two things that I don't like about this:
   *
   * - I'm sending the whole result/notification messages inside the
   * Summary instead of custom new mesages
   * - The message is constructed here instead of another layer where
   * all messages are made
   */
  dataForChannel.forEach((v, k) => {
    controlResultMessages.push({
      channel: k, data: {
        type: 'Notification',
        id: 'GameStateUpdate',
        data: v
      }
    })
  })

  // TODO rename this properties
  return { playerResultMessages, controlResultMessages }
}
