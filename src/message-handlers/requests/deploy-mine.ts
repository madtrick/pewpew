import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../../message-handlers'
import { DeployMineMessage } from '../../messages'
import { PLAYER_RADIUS } from '../../player'
import { createMine, MINE_RADIUS } from '../../mine'
import { Position } from '../../types'
import Config from '../../config'

export interface DeployMineResultDetails {
  playerId: string
  id: string
  position: Position
  remainingTokens: number
  requestCostInTokens: number
}

// TODO note that by not havign HandlerResult parameterized with the kind of request result that
// we are supposed to return from here, we could be returning
export default function shoot (session: Session, _message: DeployMineMessage, state: GameState, config: Config): HandlerResult {
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'The game has not started'
      },
      state
    }
  }

  const { playerId } = session

  if (!playerId) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'There is no player registered for this session'
      },
      state
    }
  }

  const player = state.arena.findPlayer(playerId)

  if (!player) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'The player could not be found'
      },
      state
    }
  }

  const playerDeployMineCostInTokens = config.costs.playerDeployMine

  if (player.tokens < playerDeployMineCostInTokens) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'Not enough tokens to deploy a mine'
      },
      state
    }
  }

  const { arena } = state
  const { position: playerPosition, rotation } = player
  // + 2 for the border or each player
  const distance = PLAYER_RADIUS + MINE_RADIUS + 2

  // calculate mine position
  const xSign = player.rotation >= 0 && player.rotation < 90 || player.rotation > 270 && player.rotation <= 360 ? -1 : 1
  const ySign = player.rotation > 0 && player.rotation < 180 ? -1 : 1
  const rotationRadians = rotation * Math.PI / 180
  const slope = Math.tan(rotationRadians)

  // Formula: https://www.geeksforgeeks.org/find-points-at-a-given-distance-on-a-line-of-given-slope/
  const x = playerPosition.x + xSign * distance * Math.sqrt(1 / (1 + Math.pow(slope, 2)))
  const y = playerPosition.y + ySign * distance * slope * Math.sqrt(1 / (1 + Math.pow(slope, 2)))
  // detect collision with walls
  // TODO pull this to an utils module. It's used in other places (i.e. the arena)
  const withinArena = ((x + MINE_RADIUS) <= arena.width) &&
    ((y + MINE_RADIUS) <= arena.height) &&
    ((x - MINE_RADIUS) >= 0) &&
    ((y - MINE_RADIUS) >= 0)

  if (!withinArena) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'The mine can not be deployed'
      },
      state
    }
  }


  const mine = createMine({ position: { x, y } })
  player.tokens = player.tokens - playerDeployMineCostInTokens
  state.registerMine(mine)

  return {
    result: {
      session,
      success: true,
      request: RequestType.DeployMine,
      details: {
        playerId: player.id,
        id: mine.id,
        position: mine.position,
        remainingTokens: player.tokens,
        requestCostInTokens: playerDeployMineCostInTokens
      }
    },
    state
  }
}

