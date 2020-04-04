import { Player } from './player'
import { Arena, Result, ArenaPlayer, ArenaShot } from './components/arena'
import { Shot } from './shot'
import { Mine } from './mine'

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

  findPlayer (id: string): ArenaPlayer | undefined {
    return this.arena.findPlayer(id)
  }

  removeShot (shot: Shot): Result<{}, { details: { msg: string } }> {
    return this.arena.removeShot(shot)
  }

  players (): ArenaPlayer[] {
    return this.arena.players()
  }

  shots (): ArenaShot[] {
    return this.arena.shots()
  }

  registerMine (mine: Mine): Result<{}, { details: { msg: string } }> {
    return this.arena.registerMine(mine)
  }

  removeMine (mine: Mine): Result<{}, { details: { msg: string } }> {
    return this.arena.removeMine(mine)
  }

  mines (): Mine[] {
    return this.arena.mines()
  }
}
