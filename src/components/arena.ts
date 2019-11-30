import { Player, PLAYER_RADIUS } from '../player'
import { Shot } from '../shot'
import { Movement } from '../messages'
import { RadarScan, ScanResult } from './radar'
import { Position } from '../types'
import asyncStateUpdate from '../domain/async-state-update'

export type Success<T> = { status: 'ok' } & T
export type Failure<T> = { status: 'ko' } & T
export type Result<T, F> = Success<T> | Failure<F>

// TODO replace process.env with a configuration value passed to the app
const MOVEMENT_SPEED = process.env.MOVEMENT_SPEED ? Number(process.env.MOVEMENT_SPEED) : 1

export function asSuccess<T, F>(result: Result<T, F>): Success<T> | never {
  if (result.status === 'ok') {
    return result
  }

  // TODO include the failure details in the thrown error
  throw new Error('Expected a Success got a Failure')
}

/*
 * Round with 5 decimal digits
 */
function round (value: number): number {
  const multiplier = Math.pow(10, 5)

  return Math.round(multiplier * value) / multiplier
}

// TODO maybe rename this type and ArenaShot to
// RegisterPlayer and RegisteredShot
export type ArenaPlayer = Player & { position: Position }

// type ArenaPlayer = {
//   player: Player
//   position: Position
// }

export type ArenaShot = Shot & { position: Position }
// type ArenaShot = {
//   shot: Shot
//   position: Position
// }

export enum ComponentType {
  Player = 'player',
  DestroyedPlayer = 'destroyedPlayer',
  Shot = 'shot',
  Wall = 'wall',
  Radar = 'Radar'
}

export enum UpdateType {
  Movement = 'movement',
  Hit = 'hit',
  Scan = 'scan',
  PlayerDestroyed = 'playerDestroyed'
}

export type ArenaRadarScanResult = ScanResult & {
  component: {
    data: {
      playerId: string
    }
  }
}

export type Foo = (
  { type: ComponentType.Player, data: { shotId: string, id: string, damage: number, life: number } } |
  { type: ComponentType.Wall, data: { shotId: string, position: Position } } |
  { type: ComponentType.Shot, data: { id: string, position: Position } } |
  {
    type: ComponentType.Radar,
    data: {
      playerId: string,
      players: { position: Position }[],
      unknown: { position: Position }[],
      shots: { position: Position }[]
    }
  } |
  { type: ComponentType.DestroyedPlayer, data: { id: string } }
)

export class Arena {
  readonly width: number
  readonly height: number
  private arenaPlayers: ArenaPlayer[]
  private arenaShots: ArenaShot[]
  private radar: RadarScan

  constructor (options: { width: number, height: number }, modules: { radar: RadarScan }) {
    this.width = options.width
    this.height = options.height
    this.arenaPlayers = []
    this.arenaShots = []
    this.radar = modules.radar
  }

  // TODO wondering if I could remove the `players` and `shots` methods
  // and instead rely on having a `snapshot` method which returned a representation
  // of the current arena state
  players (): ArenaPlayer[] {
    // TODO remove this mapping
    return this.arenaPlayers.map((arenaPlayer) => arenaPlayer)
  }

  findPlayer (id: string): ArenaPlayer | undefined {
    return this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === id)
  }

  shots (): ArenaShot[] {
    return this.arenaShots
  }

  registerPlayer (player: Player, options?: { position: Position }): Result<{ player: ArenaPlayer }, { details: { msg: string } }> {
    const existingPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === player.id)

    if (existingPlayer) {
      return {
        status: 'ko',
        details: {
          msg: `A player with id ${player.id} is already registered`
        }
      }
    }

    let position: Position

    if (options && options.position) {
      if (!this.isPlayerPositionWithinBoundaries(options.position)) {
        return {
          status: 'ko',
          details: {
            msg: 'Given position is not valid'
          }
        }
      }

      if (this.playerCollidesWithPlayer(options.position)) {
        // TODO include the coordinates of the other player
        return {
          status: 'ko',
          details: {
            msg: `Given position provokes collision with other player (${options.position.x}, ${options.position.y})`
          }
        }
      }

      position = options.position
    } else {
      // TODO this could be an infinite loop if there is no place in the
      // arena to position the player without colliding withh other player
      while (true) {
        position = this.generatePlayerPosition()
        const collides = this.playerCollidesWithPlayer(position)

        if (!collides) {
          break;
        }
      }

    }

    const arenaPlayer = { ...player, position }
    this.arenaPlayers.push(arenaPlayer)

    return { status: 'ok', player: arenaPlayer }
  }

  registerShot (shot: Shot): Result<{ shot: ArenaShot }, void> {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === shot.player.id)

    // TODO should I check if the player exists?
    const { x: playerX, y: playerY } = arenaPlayer!.position
    /*
     * Rotate from players origin to
     * get the origin of the shot
     */
    const radians = Math.PI/180 * arenaPlayer!.rotation
    /*
     * We add 1 to the player radius considering that the shot
     * starts already on the inmediate pixel after the player
     */
    const offsetX = Math.cos(radians) * (PLAYER_RADIUS + 1)
    const offsetY = Math.sin(radians) * (PLAYER_RADIUS + 1)

    /*
     * Translate points with relation to arena origin
     * using the players coordinates
     */
    const shotX = round(offsetX + playerX)
    const shotY = round(offsetY + playerY)

    const arenaShot = { ...shot, rotation: arenaPlayer!.rotation, position: { x: shotX, y: shotY } }
    this.arenaShots.push(arenaShot)

    return { status: 'ok', shot: arenaShot }
  }

  update (
    { currentTick, shotRefillCadence, shotRefillQuantity }:
    { shotRefillCadence: number, shotRefillQuantity: number, currentTick: number }
  ): {
    type: UpdateType,
    component: Foo
  }[] {
    const dimensions = { width: this.width, height: this.height }
    const update = asyncStateUpdate(this.arenaShots, this.arenaPlayers, dimensions, this.radar, currentTick, shotRefillCadence, shotRefillQuantity)

    this.arenaPlayers = update.players
    this.arenaShots = update.shots

    return update.updates
  }

  // TODO this should take an ArenaPlayer or instead the id of the player to move
  movePlayer (movement: Movement, player: Player): Success<{ position: Position }> {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === player.id)
    // TODO throw if the player hasn't been found
    const newPosition = this.calculateNewPlayerPosition(movement, player, arenaPlayer!.position)

    const { x, y } = newPosition
    const collides = this.arenaPlayers.find((arenaPlayer) => {
      if (arenaPlayer.id === player.id) {
        return false
      }

      /*
       * Formula got at http://stackoverflow.com/a/8367547/1078859
       * (R0-R1)^2 <= (x0-x1)^2+(y0-y1)^2 <= (R0+R1)^2
       */

      const { x: ox, y: oy } = arenaPlayer.position
      const value = Math.pow((x - ox), 2) + Math.pow((y - oy), 2)
      // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
      // but will it keep it here in case we have players with different radius

      return Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) <= value && value <= Math.pow(PLAYER_RADIUS + PLAYER_RADIUS, 2)
    })

    if (this.isPlayerPositionWithinBoundaries(newPosition) && collides === undefined) {
      arenaPlayer!.position = newPosition

      return {
        status: 'ok',
        position: newPosition
      }
    } else {
      return {
        status: 'ok',
        position: arenaPlayer!.position
      }
    }
  }

  rotatePlayer (rotation: number, player: Player): void {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === player.id)
    // TODO throw if the player is not found
    arenaPlayer!.rotation = rotation
  }

  private calculateNewPlayerPosition (movement: Movement, player: Player, currentPosition: Position): Position {
    const direction = movement.direction === 'forward' ? 1 : -1
    const magnitude = direction * MOVEMENT_SPEED
    const radians = (player.rotation * Math.PI) / 180
    const dX = magnitude * Math.cos(radians)
    const dY = magnitude * Math.sin(radians)
    const newX = round(dX + currentPosition.x)
    const newY = round(dY + currentPosition.y)

    return { x: newX, y: newY }
  }

  private isPlayerPositionWithinBoundaries ({ x, y }: Position): boolean {
    return ((x + PLAYER_RADIUS) <= this.width) &&
      ((y + PLAYER_RADIUS) <= this.height) &&
      ((x - PLAYER_RADIUS) >= 0) &&
      ((y - PLAYER_RADIUS) >= 0)
  }

  private generatePlayerPosition (): { x: number, y: number } {
    /*
     * First substract the double of the radious to account for both left and right
     * , up and down edges and then add the radius to maximize the proximity to
     * the edge of the arena
     */
    const x = Math.floor(Math.random() * (this.width - PLAYER_RADIUS * 2)) + PLAYER_RADIUS
    const y = Math.floor(Math.random() * (this.height - PLAYER_RADIUS * 2)) + PLAYER_RADIUS

    return { x, y }
  }

  private playerCollidesWithPlayer (position: Position): ArenaPlayer | undefined {
    const { x, y } = position
    return this.arenaPlayers.find((arenaPlayer) => {
      /*
       * Formula got at http://stackoverflow.com/a/8367547/1078859
       * (R0-R1)^2 <= (x0-x1)^2+(y0-y1)^2 <= (R0+R1)^2
       */
        const { x: ox, y: oy } = arenaPlayer.position
        const value = Math.pow((x - ox), 2) + Math.pow((y - oy), 2)
        // TODO the Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) part is useless
        // but will it keep it here in case we have players with different radius

      return Math.pow(PLAYER_RADIUS - PLAYER_RADIUS, 2) <= value && value <= Math.pow(PLAYER_RADIUS + PLAYER_RADIUS, 2)
    })

  }
}

