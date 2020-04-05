import uuid from 'uuid/v4'
import { ChannelRef } from './messaging-hub'

enum SessionType {
  Control = 'Control',
  Player = 'Player'
}

interface Base {
  readonly uuid: string
  readonly type: SessionType
  readonly channel: ChannelRef
}

// TODO maybe rename this to PlayerSession
export interface Session extends Base {
  playerId?: string
}

export type ControlSession = Base

export function isControlSession (session: ControlSession | Session): session is ControlSession {
  return session.type === SessionType.Control
}

export function isPlayerSession (session: ControlSession | Session): session is Session {
  return session.type === SessionType.Player
}

export function createSession (channel: ChannelRef): Session {
  return {
    channel,
    uuid: uuid(),
    type: SessionType.Player
  }
}
export type CreateSessionFn = typeof createSession

export function createControlSession (channel: ChannelRef): ControlSession {
  return {
    channel,
    uuid: uuid(),
    type: SessionType.Control
  }
}
export type CreateControlSessionFn = typeof createControlSession

