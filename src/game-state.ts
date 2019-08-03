import { Player } from './game-loop'

export interface GameState {
  players: Player[]
  started: boolean
}

export enum GameStateUpdateResult {
  Success,
  Failure
}

export interface GameStateUpdate {
  result: GameStateUpdateResult
  reason?: string
  state: GameState
}

export function createGameState (): GameState {
  return {
    players: [],
    started: false
  }
}
