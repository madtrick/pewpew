import { GameState } from '../../game-state'
import { Speed, Rotation, Position, ComponentType, UpdateType } from '../../types'
import { PipelineItem, Update as GameUpdate } from '../state-update-pipeline'

/*
 * Round with 5 decimal digits
 */
function round (value: number): number {
  const multiplier = Math.pow(10, 5)

  return Math.round(multiplier * value) / multiplier
}

function calculateNewShotPosition (position: Position, rotation: Rotation, speed: Speed): Position {
  const radians = rotation * Math.PI / 180
  const dX = speed * Math.cos(radians)
  const dY = speed * Math.sin(radians)
  const newX = round(dX + position.x)
  const newY = round(dY + position.y)

  return { x: newX, y: newY }
}

export function createProcessor (shotSpeed: Speed): PipelineItem {
  return async (state: GameState): Promise<{ newState: GameState, updates: GameUpdate[] }> => {
    const shots = state.shots()
    const updates: GameUpdate[] = []

    shots.forEach((shot) => {
      shot.position = calculateNewShotPosition(shot.position, shot.rotation, shotSpeed)
      updates.push({
        type: UpdateType.Movement,
        component: {
          type: ComponentType.Shot,
          data: {
            id: shot.id,
            position: shot.position
          }
        }
      })
    })

    return {
      newState: state,
      updates
    }
  }
}
