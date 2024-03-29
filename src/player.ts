import { ComponentType } from './types'

export interface Player {
  // TODO make some of these properties readonly
  id: string
  rotation: number
  tokens: number
  life: number
  type: ComponentType.Player
}

export type PlayerId = string
export const PLAYER_RADIUS = 16 // px
export const PLAYER_MAX_LIFE = 100

// TODO Right no the `Player` represents both the human who registerd to play and the bot in the game
// I think I should split that into a:
//
// - Player, the instance representing the human playing the game. There should be only one player
// during the game is running
// - Bot, the instance representing the bot in the game. There could be multiple bots for one player
// during a game (e.g. if the player is killed but has more lives and comes back to life)
//
// The type in this file should represent the bot
export function createPlayer (options: { id: string, initialTokens: number }): Player {
  return {
    id: options.id,
    // TODO randomize the rotation. Also consider the `rotation` of a player part of the ArenaPlayer
    // type and not the base Player
    rotation: 0,
    life: PLAYER_MAX_LIFE,
    tokens: options.initialTokens,
    type: ComponentType.Player
  }
}
