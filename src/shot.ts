import uuid from 'uuid/v4'
import { ArenaPlayer } from './components/arena'

export const SHOT_RADIUS = 1

export interface Shot {
  // position: {
  //   x: number
  //   y: number
  // }
  readonly id: string
  readonly rotation: number
  readonly player: ArenaPlayer
  readonly damage: number
  // TODO add a cost to each shot
}

export function createShot (options: { player: ArenaPlayer }): Shot {
  return {
    // position: {
    //   x: 0,
    //   y: 0
    // },
    id: uuid(),
    rotation: 0,
    player: options.player,
    damage: 1
  }
}