import { Session } from './session'

export type RegisterPlayerMessage = IncommingMessage<'Request'> & {
  payload: {
    data: {
      id: string
    }
  }
}

type MovePlayer = { type: 'displacement', direction: 'forward' | 'backward' }
type RotatePlayer = { type: 'rotation', degrees: number }
export type MovePlayerMessage = IncommingMessage<'Request'> & {
  payload: {
    data: {
      movements: (MovePlayer | RotatePlayer)[]
    }
  }
}

export interface StartGameMessage extends IncommingMessage<'Command'> {}

type Sys<T> = { type: T, id: string }
export interface IncommingMessage<Type> {
  session: Session
  payload: {
    sys: Sys<Type>
  }
}



export interface OutgoingMessage<T> {
  data: {
    result: 'Success' | 'Failure'
    msg?: string,
    details?: T
  },
  sys: Sys<'Response'>
}
