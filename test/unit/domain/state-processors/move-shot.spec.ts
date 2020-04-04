import { expect } from 'chai'
import { GameState } from '../../../../src/game-state'
import { Arena, ArenaPlayer, asSuccess } from '../../../../src/components/arena'
import { createShot } from '../../../../src/shot'
import { createPlayer, PLAYER_RADIUS } from '../../../../src/player'
import { createProcessor } from '../../../../src/domain/state-processors/move-shot'
import { UpdateType, ComponentType } from '../../../../src/types'

describe('State processor - Move shot', () => {
  let arena: Arena
  let state: GameState
  let arenaPlayer: ArenaPlayer

  beforeEach(() => {
    arena = new Arena({ width: 300, height: 300 })
    arenaPlayer = asSuccess(
      arena.registerPlayer(
        createPlayer({ id: 'player-1', initialTokens: 10 }),
        { position: { x: 100, y: 100 } }
      )
    ).player
    state = new GameState({ arena })
  })

  it('moves the shots', async () => {
    const shotSpeed = 1
    const processor = createProcessor(shotSpeed)
    const { shot } = asSuccess(arena.registerShot(createShot({ player: arenaPlayer })))

    const { newState, updates } = await processor(state)

    const newX = 100 + PLAYER_RADIUS + 1 + shotSpeed
    expect(newState.shots()).to.have.length(1)
    expect(newState.shots()).to.include(shot)
    expect(shot.position).to.eql({ x: newX, y: 100 })
    expect(updates).to.eql([
      {
        type: UpdateType.Movement,
        component: {
          type: ComponentType.Shot,
          data: {
            id: shot.id,
            position: shot.position
          }
        }
      }
    ])
  })

  it('moves the shots with rotation different than 0', async () => {
    const shotSpeed = 1
    const processor = createProcessor(shotSpeed)
    arenaPlayer.position = { x: 50, y: 50 }
    arenaPlayer.rotation = 45
    const { shot } = asSuccess(arena.registerShot(createShot({ player: arenaPlayer })))

    await processor(state)

    expect(shot.position).to.eql({ x: 62.72793, y: 62.72793 })
  })
})
