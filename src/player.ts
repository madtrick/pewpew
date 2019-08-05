export interface Player {
  id: string
  position: {
    x: number
    y: number
  },
  rotation: number
}

export function createPlayer (options: { id: string }): Player {
  return {
    id: options.id,
    position: {
      x: 0,
      y: 0
    },
    rotation: 0
  }
}
