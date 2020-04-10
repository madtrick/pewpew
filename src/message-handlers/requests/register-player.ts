import { GameState } from '../../game-state'
import { HandlerResult, RequestType } from '../../message-handlers'
import { RegisterPlayerMessage } from '../../messages'
import { createPlayer } from '../../player'
import { Session } from '../../session'
import { Position } from '../../types'
import Config from '../../config'
import semver from 'semver'

export interface RegisterPlayerResultDetails {
  id: string
  position: Position
  rotation: number
  life: number
  tokens: number
  isGameStarted: boolean
  gameVersion: string
}

// TODO split this module into controller and domain

export default function registerPlayer (session: Session, message: RegisterPlayerMessage, state: GameState, config: Config): HandlerResult {

  const givenVersion = message.data.game.version
  if (!semver.satisfies(state.version, `^${givenVersion}`)) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RegisterPlayer,
        reason: `The specified version (${givenVersion}) does not satisfy the current game version (${state.version})`
      },
      state
    }
  }

  if (state.players().length >= config.maxPlayersPerGame) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RegisterPlayer,
        reason: 'The maximum number of players in the game has been reached. Please try again later'
      },
      state
    }
  }

  const player = createPlayer({ ...message.data, initialTokens: config.initialTokensPerPlayer })

  // TODO, maybe check if session.player is already set and reject
  const result = state.registerPlayer(player)

  // TODO reject players registering in the game if the game already started?
  if (result.status === 'ko') {
    return {
      result: {
        session,
        success: false,
        request: RequestType.RegisterPlayer,
        reason: `Player already registered with id ${message.data.id}`
      },
      state
    }
  }

  session.playerId = result.player.id

  // TODO include the initial life in the response
  // TODO control player id length
  // TODO regex for valid ids?
  return {
    result: {
      success: true,
      request: RequestType.RegisterPlayer,
      details: {
        id: result.player.id,
        position: result.player.position,
        rotation: result.player.rotation,
        life: result.player.life,
        tokens: result.player.tokens,
        isGameStarted: state.started,
        gameVersion: state.version
      }
    },
    state
  }
}
