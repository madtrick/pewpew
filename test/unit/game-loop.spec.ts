import { expect } from 'chai'
import sinon from 'sinon'
import {
  RegisterPlayerMessage,
  MovePlayerMessage,
  ShootMessage,
  StartGameMessage,
  RotatePlayerMessage,
  DeployMineMessage
} from '../../src/messages'
import { GameState } from '../../src/game-state'
import { handlers, RequestType, CommandType } from '../../src/message-handlers'
import { Arena } from '../../src/components/arena'
import { Session, createSession } from '../../src/session'
import createGameLopp, { GameLoop } from '../../src/game-loop'
import { config } from '../config'

describe('Game loop', () => {
  const arena = new Arena({ width: 100, height: 100 })

  let sandbox: sinon.SinonSandbox
  let session: Session
  let stateUpdatePipeline: sinon.SinonStub
  let loop: GameLoop

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    session = createSession({ id: 'channel-1' })
    stateUpdatePipeline = sinon.stub().callsFake((state: GameState) => Promise.resolve({ state, updates: [] }))
    loop = createGameLopp(handlers, stateUpdatePipeline)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('StartGameCommand', () => {
    it('starts the game', async () => {
      const state: GameState = new GameState({ arena })
      const message: StartGameMessage = {
        type: 'Command',
        id: 'StartGame'
      }
      const result = {
        result: {
          success: true,
          command: CommandType.StartGame
        },
        state
      } as const
      sandbox.stub(handlers.Command, 'StartGame').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Command.StartGame).to.have.been.calledOnceWith(message, state)
      expect(results).to.eql([result.result])

    })
  })

  describe('RegisterPlayerMessage', () => {
    it('registers player in game', async () => {
      const state: GameState = new GameState({ arena })
      const message: RegisterPlayerMessage = {
        data: {
          id: 'player-1'
        },
        type: 'Request',
        id: 'RegisterPlayer'
      }
      const result = {
        result: {
          success: true,
          request: RequestType.RegisterPlayer,
          details: {
            id: 'player-1',
            position: {
              x: 1,
              y: 1
            },
            rotation: 0,
            isGameStarted: false
          }
        },
        state
      } as const
      sandbox.stub(handlers.Request, 'RegisterPlayer').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Request.RegisterPlayer).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('DeployMineMessage', () => {
    it('deploys a player\'s mine in the game', async () => {
      const state: GameState = new GameState({ arena })
      const message: DeployMineMessage = {
        // TODO use enums for id and type
        type: 'Request',
        id: 'DeployMine'
      }
      const result = {
        result: {
          success: true,
          request: RequestType.DeployMine,
          details: {
            playerId: 'player-1',
            id: 'mine-1',
            position: { x: 1, y: 1 },
            remainingTokens: 5,
            requestCostInTokens: 3
          }
        },
        state
      } as const
      sandbox.stub(handlers.Request, 'DeployMine').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Request.DeployMine).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('MovePlayerMessage', () => {
    it('moves player', async () => {
      const state: GameState = new GameState({ arena })
      const message: MovePlayerMessage = {
        data: {
          movement: {
            direction: 'forward'
          }
        },
        type: 'Request',
        id: 'MovePlayer'
      }
      const result = {
        result: {
          success: true,
          request: RequestType.MovePlayer,
          details: {
            id: 'player-1',
            turboApplied: false,
            remainingTokens: 100,
            requestCostInTokens: 3,
            position: {
              x: 1,
              y: 1
            }
          }
        }, state
      } as const
      sandbox.stub(handlers.Request, 'MovePlayer').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Request.MovePlayer).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('ShootMessage', () => {
    it('shoots', async () => {
      const state: GameState = new GameState({ arena })
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot' // TODO fix the messages typings. Here I could have RegisterPlayer and the type would not complain
      }
      const result = {
        result: {
          success: true,
          request: RequestType.Shoot,
          details: {
            id: 'player-1',
            remainingTokens: 3,
            requestCostInTokens: 3
          }
        }, state
      } as const
      sandbox.stub(handlers.Request, 'Shoot').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Request.Shoot).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('RotatePlayerMessage', () => {
    it('rotates the player', async () => {
      const state: GameState = new GameState({ arena })
      const message: RotatePlayerMessage = {
        data: {
          rotation: 300
        },
        type: 'Request',
        id: 'RotatePlayer'
      }
      const result = {
        result: {
          success: true,
          request: RequestType.RotatePlayer,
          details: {
            id: 'player-1',
            rotation: 300,
            remainingTokens: 3,
            requestCostInTokens: 0
          }
        }, state
      } as const
      sandbox.stub(handlers.Request, 'RotatePlayer').returns(result)

      const { results } = await loop(state, [{ session, message }], config)

      expect(handlers.Request.RotatePlayer).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  // TODO maybe remove this test
  describe('when the game is not started', () => {
    it('does not send update notifications', async () => {
      const state: GameState = new GameState({ arena })
      const { updates } = await loop(state, [], config)

      expect(updates).to.be.empty
    })

    it('does not call the state update pipeline', async () => {
      const state: GameState = new GameState({ arena })
      await loop(state, [], config)

      expect(stateUpdatePipeline).to.not.have.been.called
    })
  })

  describe('when the game is started', () => {
    it('calls the state update pipeline', async () => {
      const state: GameState = new GameState({ arena, started: true })
      await loop(state, [], config)

      expect(stateUpdatePipeline).to.have.been.calledOnceWith(state)
    })

    it('calls the message handlers with the updated state', async () => {
      const state: GameState = new GameState({ arena, started: true })
      const newState: GameState = new GameState({ arena, started: true })
      const message: RotatePlayerMessage = {
        data: {
          rotation: 300
        },
        type: 'Request',
        id: 'RotatePlayer'
      }
      const result = {
        result: {
          success: true,
          request: RequestType.RotatePlayer,
          details: {
            id: 'player-1',
            rotation: 300,
            remainingTokens: 3,
            requestCostInTokens: 0
          }
        }, state
      } as const
      stateUpdatePipeline.resolves({ state: newState, updates: [] })
      sandbox.stub(handlers.Request, 'RotatePlayer').returns(result)

      await loop(state, [{ session, message }], config)

      expect(handlers.Request.RotatePlayer).to.have.been.calledOnceWith(session, message, newState)
    })
  })
})
