export interface RegisterPlayerMessage extends IncommingMessage<'Request'> {
  data: { id: string }
}

export interface StartGameMessage extends IncommingMessage<'Command'> {

}

export interface IncommingMessage<Type> {
  sys: {
    type: Type
    id: string
  }
}

export interface OutgoingMessage {
  data: {
    result: 'Success' | 'Failure'
    msg?: string
  },
  sys: {
    id: string
    type: 'Response'
  }
}
