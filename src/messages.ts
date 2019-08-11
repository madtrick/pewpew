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

export interface ShootMessage extends IncommingMessage<'Request'> {}

export interface StartGameMessage extends IncommingMessage<'Command'> {}

type Sys<T> = { type: T, id: string }
export interface IncommingMessage<Type> {
  session: Session
  payload: {
    sys: Sys<Type>
  }
}



// TODO this interface need doesn't seem to be the best
// maybe rename it to OutgoingResponse since they are the response
// to an IncommingMessage
export interface OutgoingMessage<T> {
  data: {
    result: 'Success' | 'Failure'
    msg?: string, // TODO: move this into details?
    details?: T
  },
  sys: Sys<'Response'>
}

export interface UpdateMessage {
  data: any
  sys: Sys<'Update'>
}
