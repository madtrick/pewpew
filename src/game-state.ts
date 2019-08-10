import { Player } from './player'
import { Arena, Success, Failure, Position } from './components/arena'

export enum GameStateUpdateResult {
  Success,
  Failure
}

export interface GameStateUpdate {
  result: GameStateUpdateResult
  reason?: string
  state: GameState
}

export class GameState {
  readonly arena: Arena
  started: boolean

  constructor (options: { arena: Arena }) {
    this.arena = options.arena
    this.started = false
  }

  registerPlayer (player: Player): Success<{ player: Player, position: Position }> | Failure<{ details: { msg: string } }> {
    return this.arena.registerPlayer(player)
  }

  players (): Player[] {
    return this.arena.players()
  }
}
