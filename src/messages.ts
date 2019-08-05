import { Session } from './session'

export type RegisterPlayerMessage = IncommingMessage<'Request'> & {
  payload: {
    data: {
      id: string
    }
  }
}

export type Movement ={ direction: 'forward' | 'backward' }
export type MovePlayerMessage = IncommingMessage<'Request'> & {
  payload: {
    data: {
      movement: Movement
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
    msg?: string, // TODO: move this into details?
    details?: T
  },
  sys: Sys<'Response'>
}
