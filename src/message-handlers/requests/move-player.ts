import { MovePlayerMessage } from '../../messages'
import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../index'
import { MovePlayer } from '../../domain/move-player'
import Config from '../../config'

// TODO unifiy the PlayerPosition (or Position) in just one place
// instead of having the same structure used in different places
// with different names
export type PlayerPosition = {
  x: number
  y: number
}

export interface MovePlayerResultDetails {
  id: string
  position: PlayerPosition
  turboApplied: boolean
  requestCostInTokens: number
  remainingTokens: number
  errors?: { msg: string }[]
}

export default function movePlayer (
  session: Session,
  message: MovePlayerMessage,
  state: GameState,
  domain: MovePlayer,
  config: Config
): HandlerResult {
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.MovePlayer,
        reason: 'The game has not started'
      },
      state
    }
  }

  const player = state.players().find((player) => player.id === session.playerId)

  if (!player) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.MovePlayer,
        reason: 'The player could not be found'
      },
      state
    }
  }

  const movement = message.data.movement
  const arena = state.arena
  const playerSpeed = config.movementSpeeds.player
  const turboCostInTokens = config.costs.playerMovementTurbo
  const turboMultiplierFactor = config.turboMultiplierFactor
  const domainResult = domain(movement, playerSpeed, turboCostInTokens, turboMultiplierFactor, player, arena.players(), { width: arena.width, height: arena.height })

  if (domainResult.status === 'ok') {
    const result: {
      session: Session
      success: true
      // TODO this should be a type `RequestResult` from
      // message-handlers/index
      request: RequestType.MovePlayer
      details: MovePlayerResultDetails
    } = {
      session,
      success: true,
      request: RequestType.MovePlayer,
      details: {
        id: player.id,
        turboApplied: domainResult.turboApplied,
        requestCostInTokens: domainResult.actionCostInTokens,
        remainingTokens: domainResult.player.tokens,
        position: domainResult.player.position
      }
    }

    if (domainResult.errors) {
      result.details.errors = domainResult.errors
    }

    return {
      result,
      state
    }
  } else {
    // TODO give a meaningful reason
    return {
      state,
      result: {
        session,
        request: RequestType.MovePlayer,
        success: false,
        reason: 'Unknown error'
      }
    }
  }
}

