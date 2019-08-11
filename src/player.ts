export interface Player {
  id: string
  rotation: number
  life: number
  // TODO rename this to shot tokens
  shots: number
}

export const PLAYER_RADIUS = 16 //px

export function createPlayer (options: { id: string }): Player {
  return {
    id: options.id,
    rotation: 0,
    life: 100,
    shots: 50
  }
}
