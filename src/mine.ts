import uuid from 'uuid/v4'
import { Position } from './types'
import { PLAYER_RADIUS } from './player'

export const MINE_RADIUS = PLAYER_RADIUS/2
export const MINE_HIT_COST = 20

export interface Mine {
  id: string
  position: Position
}

export function createMine (options: { position: Position }): Mine {
  return {
    id: uuid(),
    position: options.position
  }
}