import { ArenaPlayer } from './components/arena'
import uuid from 'uuid/v4'

export interface Session {
  readonly uuid: string
  player?: ArenaPlayer
}

export function createSession (): Session {
  return {
    uuid: uuid()
  }
}

