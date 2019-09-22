import { expect } from 'chai'
import { createSession, createControlSession } from '../../src/session'
import engine, { createEngineState } from '../../src/engine'
import { GameState } from '../../src/game-state'
import { Arena } from '../../src/components/arena'
import { handlers } from '../../src/message-handlers'
import createGameLoop from '../../src/game-loop'
import createLogger from '../utils/create-logger'

describe('Engine - Integration', () => {
  const logger = createLogger()

  describe('RegisterPlayer request', () => {
    it('responds as expected', async () => {
      const arena = new Arena ({ width: 500, height: 500 })
      const gameState = new GameState({ arena })
      const engineState = createEngineState(arena, gameState)
      const gameLoop = createGameLoop(handlers)
      const playerMessages = [
        {
          channel: { id: 'channel-2' },
          data: {
            sys: {
              type: 'Request',
              id: 'RegisterPlayer'
            },
            data: {
              id: 'jake'
            }
          }
        }
      ]

      const { playerResultMessages } = await engine(engineState, gameLoop, [], playerMessages, createSession, createControlSession, { logger })

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
      const arena = new Arena ({ width: 500, height: 500 })
      const gameState = new GameState({ arena })
      const engineState = createEngineState(arena, gameState)
      const gameLoop = createGameLoop(handlers)
      const controlMessages = [
        {
          channel: { id: 'channel-1' },
          data: {
            sys: {
              type: 'Command',
              id: 'StartGame'
            }
          }
        }
      ]

      const { controlResultMessages  } = await engine(engineState, gameLoop, controlMessages, [], createSession, createControlSession, { logger })

      // TODO once chaijs is bumped to version 5 we might be able to write
      // loose matchers and then be able to combine these two expectations in one
      //
      // https://github.com/chaijs/chai/issues/644
      expect(controlResultMessages).to.have.lengthOf(1)
      expect(controlResultMessages[0]).to.deep.include({
        data: {
          type: 'Response',
          id: 'StartGame',
          success: true
        }
      })
    })

    it('notifies players', async () => {
      const arena = new Arena ({ width: 500, height: 500 })
      const gameState = new GameState({ arena })
      const engineState = createEngineState(arena, gameState)
      const gameLoop = createGameLoop(handlers)
      const playerMessages = [
        {
          channel: { id: 'channel-2' },
          data: {
            sys: {
              type: 'Request',
              id: 'RegisterPlayer'
            },
            data: {
              id: 'jake'
            }
          }
        },
        {
          channel: { id: 'channel-3' },
          data: {
            sys: {
              type: 'Request',
              id: 'RegisterPlayer'
            },
            data: {
              id: 'mike'
            }
          }
        }
      ]

      await engine(engineState, gameLoop, [], playerMessages, createSession, createControlSession, { logger })

      const controlMessages = [
        {
          channel: { id: 'channel-1' },
          data: {
            sys: {
              type: 'Command',
              id: 'StartGame'
            }
          }
        }
      ]

      const { playerResultMessages, controlResultMessages } = await engine(engineState, gameLoop, controlMessages, [], createSession, createControlSession, { logger })
      expect(controlResultMessages).to.have.lengthOf(1)
      expect(controlResultMessages[0].data).to.eql({
        type: 'Response',
        id: 'StartGame',
        success: true
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

