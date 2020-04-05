import { GameState } from '../game-state'
import { Position, UpdateType, ComponentType } from '../types'
import { ScannedMine, ScannedPlayer, ScannedShot, ScannedUnknown } from '../components/radar'

export type WallHitUpdate = {
  type: UpdateType.Hit
  component: { type: ComponentType.Wall, data: { shotId: string, position: Position } }
}

export type PlayerHitUpdate = {
  type: UpdateType.Hit
  component: { type: ComponentType.Player, data: { shotId: string, id: string, damage: number, life: number } }
}

type ShotMovementUpdate = { type: UpdateType.Movement } &
{ component: { type: ComponentType.Shot, data: { id: string, position: Position } } }

type PlayerDestroyUpdate = { type: UpdateType.PlayerDestroyed } &
{ component: { type: ComponentType.DestroyedPlayer, data: { id: string } } }

type ComponentHitUpdate = {
  type: UpdateType.Hit
  component: {
    type: ComponentType
    data: {
      id: string
      damage: number
      playerId: string
    }
  }
}

type ComponentScanUpdate = {
  type: UpdateType.Scan
  component: {
    type: ComponentType.Radar
    data: {
      playerId: string
      players: ScannedPlayer[]
      unknown: ScannedUnknown[]
      shots: ScannedShot[]
      mines: ScannedMine[]
    }
  }
}

// TODO this type is here only to be able to use the Update type
// in the update-to-notification module where we transform a RemovePlayer update
// injected by the engine
type RemovePlayer = {
  type: UpdateType.RemovePlayer
  component: {
    type: ComponentType.Player
    data: {
      id: string
    }
  }
}

export type Update =
  ShotMovementUpdate
  | PlayerDestroyUpdate
  | PlayerHitUpdate
  | WallHitUpdate
  | ComponentScanUpdate
  | ComponentHitUpdate
  | RemovePlayer

export type PipelineItem = (state: GameState) => Promise<{ newState: GameState, updates: Update[]}>
type Pipeline = PipelineItem[]

export async function process (pipeline: Pipeline, state: GameState): Promise<{ state: GameState, updates: Update[] }> {
  let currentState = state
  let updates: Update[] = []

  for (const processor of pipeline) {
    const { newState: s, updates: u } = await processor(state)
    currentState = s
    updates = [...updates, ...u]
  }

  return { state: currentState, updates }
}

