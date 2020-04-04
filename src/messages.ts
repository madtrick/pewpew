import Joi from '@hapi/joi'

export type RegisterPlayerMessage = IncommingMessage<'Request'> & {
  data: {
    game: {
      version: string
    }
    id: string
  }
}

export type Movement = { direction: 'forward' | 'backward', withTurbo?: boolean }
export type MovePlayerMessage = IncommingMessage<'Request'> & {
  data: {
    movement: Movement
  }
}
export type RotatePlayerMessage = IncommingMessage<'Request'> & {
  data: {
    rotation: number
  }
}

export interface DeployMineMessage extends IncommingMessage<'Request'> {}

export interface ShootMessage extends IncommingMessage<'Request'> {}

export interface StartGameMessage extends IncommingMessage<'Command'> {}


export interface IncommingMessage<Type> {
  type: Type
  id: string
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
  type: 'Response'
  id: string
}

export interface UpdateMessage {
  data: any
  type: 'Update'
  id: string
}

// TODO is there a better way to make all properties required
const REGISTER_PLAYER_SCHEMA = Joi.object().keys({
  type: Joi.string().valid('Request').required(),
  id: Joi.string().valid('RegisterPlayer').required(),
  data: Joi.object().keys({
    game: Joi.object().keys({
      version: Joi.string().required()
    }).required(),
    id: Joi.string().required()
  }).required() // TODO restrict the id more
})

const MOVE_PLAYER_SCHEMA = Joi.object().keys({
  type: Joi.string().valid('Request').required(),
  id: Joi.string().valid('MovePlayer').required(),
  data: Joi.object().keys({
    movement: Joi.object().keys({
      direction: Joi.string().valid(['forward', 'backward']).required(),
      withTurbo: Joi.boolean().optional()
    }).required()
  })
})

const ROTATE_PLAYER_SCHEMA = Joi.object().keys({
  type: Joi.string().valid('Request').required(),
  id: Joi.string().valid('RotatePlayer').required(),
  data: Joi.object().keys({
    rotation: Joi.number().min(0).max(360).required()
  })
})

const SHOOT_SCHHEMA = Joi.object().keys({
  type: Joi.string().valid('Request').required(),
  id: Joi.string().valid('Shoot').required()
})

const START_GAME_SCHEMA = Joi.object().keys({
  type: Joi.string().valid('Command').required(),
  id: Joi.string().valid('StartGame').required()
})

const DEPLOY_MINE_SCHEMA = Joi.object().keys({
  type: Joi.string().valid('Request').required(),
  id: Joi.string().valid('DeployMine').required()
})

const schemas = [
  REGISTER_PLAYER_SCHEMA,
  MOVE_PLAYER_SCHEMA,
  ROTATE_PLAYER_SCHEMA,
  SHOOT_SCHHEMA,
  START_GAME_SCHEMA,
  DEPLOY_MINE_SCHEMA
]

export function validateMessage (message: object): boolean {
  // TODO maybe first check if message.type is present
  // and then use that to find the schema it should validate
  // TODO remove this tslint ignore. The typings say that ".error" can't be
  // null but the docs says otherwise. Because of this inconsistence I'm getting
  // the following linting error:
  //
  // src/messages.ts:108:55 - Expression is always false (the line number should
  // refer to the one below)
  // tslint:disable-next-line:strict-type-predicates
  return !!schemas.find((schema) => schema.validate(message).error === null)
}

