import { Player, PLAYER_RADIUS } from '../player'
import { Shot } from '../shot'
import { Mine } from '../mine'
import { Position } from '../types'
import { round } from '../helpers'

export type Success<T = {}> = { status: 'ok' } & T
export type Failure<T> = { status: 'ko' } & T
// TODO move this to Types
export type Result<T, F> = Success<T> | Failure<F>

export function asSuccess<T, F> (result: Result<T, F>): Success<T> | never {
  if (result.status === 'ok') {
    return result
  }

  // TODO the failure could have a toString method to render itself
  // giving some details about the failure without having to call
  // JSON.stringify
  throw new Error(`Expected a Success got a Failure ((${JSON.stringify(result)}))`)
}

// TODO maybe rename this type and ArenaShot to
// RegisterPlayer and RegisteredShot
export type ArenaPlayer = Player & { position: Position }

// type ArenaPlayer = {
//   player: Player
//   position: Position
// }

// TODO remove this type and instead have just a Shot type
// with a discriminant property, for example "shot.status" and
// based on that add additional properties like the position
export type ArenaShot = Shot & { position: Position }
// type ArenaShot = {
//   shot: Shot
//   position: Position
// }

export class Arena {
  readonly width: number
  readonly height: number
  private arenaPlayers: ArenaPlayer[]
  private arenaShots: ArenaShot[]
  private arenaMines: Mine[]

  constructor (options: { width: number, height: number }) {
    this.width = options.width
    this.height = options.height
    this.arenaPlayers = []
    this.arenaShots = []
    this.arenaMines = []
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

  removeMine (mine: Mine): Result<{}, { details: { msg: string } }> {
    const existingMine = this.arenaMines.find((arenaMine) => arenaMine.id === mine.id)

    if (!existingMine) {
      return {
        status: 'ko',
        details: {
          msg: `A mine with id ${mine.id} can not be found in the arena`
        }
      }
    }

    this.arenaMines = this.arenaMines.filter((arenaMine) => arenaMine.id !== mine.id)

    return {
      status: 'ok'
    }
  }

  registerMine (mine: Mine): Result<{}, { details: { msg: string } }> {
    this.arenaMines.push(mine)
    return { status: 'ok' }
  }

  mines (): Mine[] {
    return this.arenaMines
  }

  removeShot (shot: Shot): Result<{}, { details: { msg: string } }> {
    const existingShot = this.arenaShots.find((arenaShot) => arenaShot.id === shot.id)

    if (!existingShot) {
      return {
        status: 'ko',
        details: {
          msg: `A shot with id ${shot.id} can not be found in the arena`
        }
      }
    }

    this.arenaShots = this.arenaShots.filter((arenaShot) => arenaShot.id !== shot.id)

    return {
      status: 'ok'
    }
  }

  removePlayer (player: Player): Result<{}, { details: { msg: string } }> {
    const existingPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === player.id)

    // TODO could be that we are already checking somewhere else if the player exists
    // so we shouldn't be re-checking it here
    if (!existingPlayer) {
      return {
        status: 'ko',
        details: {
          msg: `A player with id ${player.id} can not be found in the arena`
        }
      }
    }

    this.arenaPlayers = this.arenaPlayers.filter((arenaPlayer) => arenaPlayer.id !== player.id)

    return {
      status: 'ok'
    }
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
          break
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
    const radians = Math.PI / 180 * arenaPlayer!.rotation
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

  rotatePlayer (rotation: number, player: Player): void {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.id === player.id)
    // TODO throw if the player is not found
    arenaPlayer!.rotation = rotation
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

