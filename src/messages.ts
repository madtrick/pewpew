import Joi from '@hapi/joi'

export type RegisterPlayerMessage = IncommingMessage<'Request'> & {
  data: {
    id: string
  }
}

export type Movement = { direction: 'forward' | 'backward' }
export type MovePlayerMessage = IncommingMessage<'Request'> & {
  data: {
    movement: Movement
  }
}

export interface ShootMessage extends IncommingMessage<'Request'> {}

export interface StartGameMessage extends IncommingMessage<'Command'> {}

type Sys<T> = { type: T, id: string }
export interface IncommingMessage<Type> {
  sys: Sys<Type>
}

export type IncommingMessages = RegisterPlayerMessage | MovePlayerMessage | ShootMessage

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

const REGISTER_PLAYER_SCHEMA = Joi.object().keys({
  sys: Joi.object().keys({
    type: Joi.string().valid('Request'),
    id: Joi.string().valid('RegisterPlayer')
  }),
  data: Joi.object().keys({
    id: Joi.string()
  }) //TODO restrict the id more
})

const MOVE_PLAYER_SCHEMA = Joi.object().keys({
  sys: Joi.object().keys({
    type: Joi.string().valid('Request'),
    id: Joi.string().valid('MovePlayer')
  }),
  data: Joi.object().keys({
    movement: Joi.object().keys({
      direction: Joi.string().valid(['forward', 'backward'])
    })
  }) //TODO restrict the id more
})

const SHOOT_SCHHEMA = Joi.object().keys({
  sys: Joi.object().keys({ type: Joi.string().valid('Request'), id: Joi.string().valid('Shoot') }),
})

const schemas = [REGISTER_PLAYER_SCHEMA, MOVE_PLAYER_SCHEMA, SHOOT_SCHHEMA]

export function validateMessage (message: object): boolean {
  return !!schemas.find((schema) => schema.validate(message).error === null)
}

