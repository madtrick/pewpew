export interface Player {
  id: string
  rotation: number
  life: number
  // TODO rename this to shot tokens
  shots: number
}

export const PLAYER_RADIUS = 16 //px

// TODO Right no the `Player` represents both the human who registerd to play and the bot in the game
// I think I should split that into a:
//
// - Player, the instance representing the human playing the game. There should be only one player
// during the game is running
// - Bot, the instance representing the bot in the game. There could be multiple bots for one player
// during a game (e.g. if the player is killed but has more lives and comes back to life)
//
// The type in this file should represent the bot
export function createPlayer (options: { id: string }): Player {
  return {
    id: options.id,
    rotation: 0,
    life: 100,
    shots: 50
  }
}
