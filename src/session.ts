import uuid from 'uuid/v4'

enum SessionType {
  Control = 'Control',
  Player = 'Player'
}

interface Base {
  readonly uuid: string
  readonly type: SessionType
}

// TODO maybe rename this to PlayerSession
export interface Session extends Base {
  readonly uuid: string
  playerId?: string
}

export interface ControlSession extends Base {}

export function isControlSession (session: ControlSession | Session): session is ControlSession {
  return session.type === SessionType.Control
}

export function isPlayerSession (session: ControlSession | Session): session is Session {
  return session.type === SessionType.Player
}

export function createSession (): Session {
  return {
    uuid: uuid(),
    type: SessionType.Player
  }
}
export type CreateSessionFn = typeof createSession

export function createControlSession (): ControlSession {
  return {
    uuid: uuid(),
    type: SessionType.Control
  }
}
export type CreateControlSessionFn = typeof createControlSession

