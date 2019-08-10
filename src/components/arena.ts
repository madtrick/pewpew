import { Player, PLAYER_RADIUS } from '../player'
import { Movement } from '../messages'

export type Success<T> = { status: 'ok' } & T
export type Failure<T> = { status: 'ko' } & T
export type Result<T, F> = Success<T> | Failure<F>
export type Position = { x: number, y: number }

/*
 * Round with 5 decimal digits
 */
function round (value: number): number {
  const multiplier = Math.pow(10, 5)

  return Math.round(multiplier * value) / multiplier
}

type ArenaPlayer = {
  player: Player
  position: Position
}

export class Arena {
  readonly width: number
  readonly height: number
  private readonly arenaPlayers: ArenaPlayer[]

  constructor (options: { width: number, height: number }) {
    this.width = options.width
    this.height = options.height
    this.arenaPlayers = []
  }

  players (): Player[] {
    return this.arenaPlayers.map((arenaPlayer) => arenaPlayer.player)
  }

  registerPlayer (player: Player): Result<{ player: Player, position: Position }, { details: { msg: string } }> {
    const existingPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.player.id === player.id)

    if (existingPlayer) {
      return {
        status: 'ko',
        details: {
          msg: `A player with id ${player.id} is already registered`
        }
      }
    }

    let position: Position
    // TODO this could be an infinite loop if there is no place in the
    // arena to position the player without colliding withh other player
    while (true) {
      position = this.generatePlayerPosition()
      const { x, y } = position
      const collides = this.arenaPlayers.find((arenaPlayer) => {
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

      if (!collides) {
        break;
      }
    }

    this.arenaPlayers.push({ player, position })

    return { status: 'ok', player, position }
  }

  movePlayer (movement: Movement, player: Player): Success<{ position: Position }> {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.player === player)
    // TODO throw if the player hasn't been found
    const newPosition = this.calculateNewPlayerPosition(movement, player, arenaPlayer!.position)

    const { x, y } = newPosition
    const collides = this.arenaPlayers.find((arenaPlayer) => {
      if (arenaPlayer.player === player) {
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

  placePlayer (position: Position, player: Player): void {
    const arenaPlayer = this.arenaPlayers.find((arenaPlayer) => arenaPlayer.player === player)

    arenaPlayer!.position = position
  }

  private calculateNewPlayerPosition (movement: Movement, player: Player, currentPosition: Position): Position {
    const direction = movement.direction === 'forward' ? 1 : -1
    const speed = 1
    const magnitude = direction * speed
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
}

