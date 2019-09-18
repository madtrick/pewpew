import { Player } from './player'
import { Arena, Success, Failure, ArenaPlayer } from './components/arena'

export enum GameStateUpdateResult {
  Success,
  Failure
}

export interface GameStateUpdate {
  result: GameStateUpdateResult
  reason?: string
  state: GameState
}

// TODO do we need the game state. Besides the `started` flag there's not much else
// going on here
export class GameState {
  readonly arena: Arena
  started: boolean

  constructor (options: { arena: Arena }) {
    this.arena = options.arena
    this.started = false
  }

  registerPlayer (player: Player): Success<{ player: ArenaPlayer }> | Failure<{ details: { msg: string } }> {
    return this.arena.registerPlayer(player)
  }

  players (): Player[] {
    return this.arena.players()
  }

  // TODO fix this type and use the type from the arena
  update (): any{
    if (!this.started) {
      return []
    }

    return this.arena.update()
  }
}
