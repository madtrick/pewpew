import { expect } from 'chai'
import { UpdateType, ComponentType } from '../../../../src/types'
import { GameState } from '../../../../src/game-state'
import { Arena, ArenaPlayer, asSuccess } from '../../../../src/components/arena'
import { createShot, SHOT_DAMAGE } from '../../../../src/shot'
import { createPlayer, PLAYER_RADIUS, PLAYER_MAX_LIFE } from '../../../../src/player'
import { createProcessor } from '../../../../src/domain/state-processors/shot-hits'
import { config } from '../../../config'

describe('State processor - Shot hits', () => {
  let arena: Arena
  let state: GameState
  let arenaPlayer: ArenaPlayer
  const arenaWidth = 300
  const arenaHeight = 300
  const player1 = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
  const player2 = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })
  const processor = createProcessor({ width: arenaWidth, height: arenaHeight })

  beforeEach(() => {
    arena = new Arena({ width: arenaWidth, height: arenaHeight })
    state = new GameState({ arena })
  })

  // TODO add test to validate that if there's no hit the shot is not removed
  // and the players life stays the same

  it('detects hits to walls', async () => {
    arenaPlayer = asSuccess(
      arena.registerPlayer(player1, { position: { x: arenaWidth - PLAYER_RADIUS - 1, y: 100 } })
    ).player
    const { shot } = asSuccess(arena.registerShot(createShot({ player: arenaPlayer })))

    const { newState, updates } = await processor(state)

    const shots = newState.shots()
    expect(shots).to.be.empty
    expect(updates).to.eql([
      {
        type: UpdateType.Hit,
        component: {
          type: ComponentType.Wall,
          data: { position: shot.position, shotId: shot.id }
        }
      }
    ])
  })

  describe('hits to players', () => {
    it('detects hits to players', async () => {
      const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
      const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: shooter.position.x + PLAYER_RADIUS * 2 + 1, y: 50 } })).player
      const initialOtherPlayerLife = otherPlayer.life
      // TODO clarify when the hit happens. Does the hit have to cross the
      // border of the player bounding circle or is it enough if it tangential?
      shooter.rotation = 0
      otherPlayer.rotation = 0
      const shot = createShot({ player: shooter })
      arena.registerShot(shot)

      const { newState, updates } = await processor(state)
      const shots = newState.shots()
      expect(shots).to.be.empty
      const targetPlayer = arena.findPlayer('player-2') as ArenaPlayer
      expect(targetPlayer.life).to.eql(initialOtherPlayerLife - shot.damage)
      expect(updates).to.eql([{
        type: UpdateType.Hit,
        component: {
          type: ComponentType.Player,
          data: {
            id: targetPlayer.id,
            life: targetPlayer.life,
            damage: shot.damage,
            shotId: shot.id
          }
        }
      }])
    })

    it('destroys player', async () => {
      const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 31, y: 50 } })).player
      const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 65, y: 50 } })).player

      shooter.rotation = 0
      otherPlayer.rotation = 0
      otherPlayer.life = PLAYER_MAX_LIFE - (PLAYER_MAX_LIFE - 1)
      const shot = createShot({ player: shooter })
      arena.registerShot(shot)

      // After the loop the shot is at x=47. One movement more and the
      // player will be tangential to the player which is considered a hit

      const { newState, updates } = await processor(state)
      const targetPlayer = newState.findPlayer('player-2')
      expect(targetPlayer).to.be.undefined
      expect(updates[1]).to.eql({
        type: UpdateType.PlayerDestroyed,
        component: {
          type: ComponentType.DestroyedPlayer,
          data: {
            id: otherPlayer.id
          }
        }
      })
    })
  })

  describe('destroyed players', () => {
    it('does not consider them as hits', async () => {
      const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 31, y: 50 } })).player
      const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 65, y: 50 } })).player

      shooter.rotation = 0
      otherPlayer.rotation = 0
      otherPlayer.life = SHOT_DAMAGE
      const shot1 = createShot({ player: shooter })
      const shot2 = createShot({ player: shooter })
      arena.registerShot(shot1)
      const { shot: remainingShot } = asSuccess(arena.registerShot(shot2))

      // After the loop the shot is at x=47. One movement more and the
      // player will be tangential to the player which is considered a hit

      await processor(state)

      expect(state.shots()).to.eql([remainingShot])
    })
  })
})

