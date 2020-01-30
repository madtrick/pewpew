import { Player } from './player'
import { Arena, Result, ArenaPlayer } from './components/arena'
import Config from './config'

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

  constructor (options: { arena: Arena, started?: boolean }) {
    this.arena = options.arena
    this.started = options.started || false
  }

  registerPlayer (player: Player): Result<{ player: ArenaPlayer }, { details: { msg: string } }> {
    return this.arena.registerPlayer(player)
  }

  removePlayer (player: Player): Result<{}, { details: { msg: string } }> {
    return this.arena.removePlayer(player)
  }

  players (): Player[] {
    return this.arena.players()
  }

  // TODO fix this type and use the type from the arena
  update (config: Config, options: { shotRefillCadence: number, shotRefillQuantity: number, currentTick: number, tokenIncreaseQuantity: number}): any {
    if (!this.started) {
      return []
    }

    return this.arena.update(config, options)
  }
}
