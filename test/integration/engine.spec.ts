import { expect } from 'chai'
import engine, { createEngineState } from '../../src/engine'
import { GameState } from '../../src/game-state'
import { Arena } from '../../src/components/arena'
import { scan } from '../../src/components/radar'
import { handlers } from '../../src/message-handlers'
import createGameLoop from '../../src/game-loop'
import { createSession, createControlSession } from '../../src/session'
import createLogger from '../utils/create-logger'
import { config } from '../config'
import { createProcessor as createMoveShotPipelineProcessor } from '../../src/domain/state-processors/move-shot'
import { createProcessor as createMineHitPipelineProcessor } from '../../src/domain/state-processors/mine-hit'
import { createProcessor as createShotHitPipelineProcessor } from '../../src/domain/state-processors/shot-hits'
import { createProcessor as createRadarScanPipelineProcessor } from '../../src/domain/state-processors/radar-scan'
import { process, Update } from '../../src/domain/state-update-pipeline'
import VERSION from '../../src/version'

describe('Engine - Integration', () => {
  let arena: Arena
  let gameState: GameState
  const arenaWidth = 500
  const arenaHeight = 500
  const logger = createLogger()
  const statePipeline = [
    createMoveShotPipelineProcessor(config.movementSpeeds.shot),
    createShotHitPipelineProcessor({ width: arenaWidth, height: arenaHeight }),
    createMineHitPipelineProcessor(),
    createRadarScanPipelineProcessor(scan)
  ]
  const statePipelineProcessor = (state: GameState): Promise<{ state: GameState, updates: Update[] }> => process(statePipeline, state)
  const gameLoop = createGameLoop(handlers, statePipelineProcessor)

  beforeEach(() => {
    arena = new Arena({ width: arenaWidth, height: arenaHeight })
    gameState = new GameState({ arena })
  })

  describe('RegisterPlayer request', () => {
    it('responds as expected', async () => {
      const session = createSession({ id: 'channel-2' })
      // TODO I've to create this session here because the code expects a control
      // session to be present. Does that make sense in all cases? For example
      // a player can register before a control session is created
      const controlSession = createControlSession({ id: 'channel-1' })
      const engineState = createEngineState(arena, gameState)
      const playerMessages = [
        {
          channel: { id: 'channel-2' },
          data: {
            type: 'Request',
            id: 'RegisterPlayer',
            data: {
              game: {
                version: VERSION
              },
              id: 'jake'
            }
          }
        }
      ]

      engineState.channelSession.set('channel-2', session)
      engineState.channelSession.set('channel-1', controlSession)

      const { playerResultMessages } = await engine(engineState, gameLoop, [], playerMessages, [], { logger, config })

      expect(playerResultMessages).to.have.lengthOf(1)
      expect(playerResultMessages[0].data).to.include({
        type: 'Response',
        id: 'RegisterPlayer',
        success: true
      })
      expect((playerResultMessages[0] as any).data.details.position.x).to.be.a('number')
      expect((playerResultMessages[0].data as any).details.position.y).to.be.a('number')
    })
  })

  describe('StartGame command', () => {
    it('responds as expected', async () => {
      const controlSession = createControlSession({ id: 'channel-1' })
      const engineState = createEngineState(arena, gameState)
      const gameLoop = createGameLoop(handlers, statePipelineProcessor)
      const controlMessages = [
        {
          channel: { id: 'channel-1' },
          data: {
            type: 'Command',
            id: 'StartGame'
          }
        }
      ]

      engineState.channelSession.set('channel-1', controlSession)

      const { controlResultMessages } = await engine(engineState, gameLoop, controlMessages, [], [], { logger, config })

      // TODO once chaijs is bumped to version 5 we might be able to write
      // loose matchers and then be able to combine these two expectations in one
      //
      // https://github.com/chaijs/chai/issues/644
      expect(controlResultMessages).to.have.lengthOf(1)
      expect(controlResultMessages[0]).to.deep.include({
        data: {
          type: 'Notification',
          id: 'GameStateUpdate',
          data: [{
            type: 'Response',
            id: 'StartGame',
            success: true
          }]
        }
      })
    })

    it('notifies players', async () => {
      const controlSession = createControlSession({ id: 'channel-1' })
      const session1 = createSession({ id: 'channel-2' })
      const session2 = createSession({ id: 'channel-3' })
      const engineState = createEngineState(arena, gameState)
      const playerMessages = [
        {
          channel: { id: 'channel-2' },
          data: {
            type: 'Request',
            id: 'RegisterPlayer',
            data: {
              id: 'jake'
            }
          }
        },
        {
          channel: { id: 'channel-3' },
          data: {
            type: 'Request',
            id: 'RegisterPlayer',
            data: {
              id: 'mike'
            }
          }
        }
      ]

      engineState.channelSession.set('channel-1', controlSession)
      engineState.channelSession.set('channel-2', session1)
      engineState.channelSession.set('channel-3', session2)

      await engine(engineState, gameLoop, [], playerMessages, [], { logger, config })

      const controlMessages = [
        {
          channel: { id: 'channel-1' },
          data: {
            type: 'Command',
            id: 'StartGame'
          }
        }
      ]

      const { playerResultMessages, controlResultMessages } = await engine(engineState, gameLoop, controlMessages, [], [], { logger, config })
      expect(controlResultMessages).to.have.lengthOf(1)
      expect(controlResultMessages[0].data).to.eql({
        type: 'Notification',
        id: 'GameStateUpdate',
        data: [{
          type: 'Response',
          id: 'StartGame',
          success: true
        }]
      })
      expect(playerResultMessages).to.have.lengthOf(2)
      expect(playerResultMessages[0].data).to.eql({
        type: 'Notification',
        id: 'StartGame'
      })
      expect(playerResultMessages[0].data).to.eql({
        type: 'Notification',
        id: 'StartGame'
      })
    })
  })
})

