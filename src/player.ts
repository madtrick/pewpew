export interface Player {
  id: string
  rotation: number
}

export const PLAYER_RADIUS = 16 //px

export function createPlayer (options: { id: string }): Player {
  return {
    id: options.id,
    rotation: 0
  }
}
