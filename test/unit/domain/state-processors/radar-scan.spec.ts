import { expect } from 'chai'
import sinon from 'sinon'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { createPlayer } from '../../../../src/player'
import { createProcessor } from '../../../../src/domain/state-processors/radar-scan'
import { GameState } from '../../../../src/game-state'
import { UpdateType, ComponentType } from '../../../../src/types'
import { config } from '../../../config'

describe('State processor - Radar scan', () => {
  let arena: Arena
  let state: GameState
  let scanStub: sinon.SinonStub
  const player1 = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
  const player2 = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })

  beforeEach(() => {
    scanStub = sinon.stub()
    arena = new Arena({ width: 500, height: 500 })
    state = new GameState({ arena })
  })


  it('calls the radar for each player', async () => {
    const registeredPlayer1 = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
    const registeredPlayer2 = asSuccess(arena.registerPlayer(player2, { position: { x: 83, y: 20 } })).player
    scanStub.returns({
      data: {
        players: [],
        unknown: []
      }
    })
    const scannableComponents = { players: state.players(), shots: state.shots(), mines: [] }
    const processor = createProcessor(scanStub)

    await processor(state)

    expect(scanStub).to.have.been.calledTwice
    expect(scanStub).to.have.been.calledWith(registeredPlayer1.position, scannableComponents)
    expect(scanStub).to.have.been.calledWith(registeredPlayer2.position, scannableComponents)
  })

  it('returns an update', async () => {
    asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } }))
    const scanResult = { players: [], mines: [], shots: [], unknown: [] }
    scanStub.returns(scanResult)
    const processor = createProcessor(scanStub)

    const { updates } = await processor(state)

    expect(updates).to.eql([{
      type: UpdateType.Scan,
      component: {
        type: ComponentType.Radar,
        data: {
          playerId: player1.id,
          ...scanResult
        }
      }
    }])
  })
})

