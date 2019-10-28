import { expect } from 'chai'
import sinon from 'sinon'
import { RegisterPlayerMessage, MovePlayerMessage, ShootMessage, StartGameMessage } from '../../src/messages'
import { GameState } from '../../src/game-state'
import { handlers, RequestType, CommandType } from '../../src/message-handlers'
import { Arena } from '../../src/components/arena'
import { createPlayer } from '../../src/player'
import { Session, createSession } from '../../src/session'
import createGameLopp from '../../src/game-loop'
import { scan } from '../../src/components/radar'

describe('Game loop', () => {
  const loop = createGameLopp(handlers)
  const arena = new Arena({ width: 100, height: 100 }, { radar: scan })

  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('StartGameCommand', () => {
    it('starts the game', async () => {
      const state: GameState = new GameState({ arena })
      const session: Session = createSession()
      const message: StartGameMessage = {
        sys: {
          type: 'Command',
          id: 'StartGame'
        }
      }
      const result = {
        result: {
          success: true,
          command: CommandType.StartGame
        },
        state
      } as const
      sandbox.stub(handlers.Command, 'StartGame').returns(result)

      const { results } = await loop(state, [{ session, message }])

      expect(handlers.Command.StartGame).to.have.been.calledOnceWith(message, state)
      expect(results).to.eql([result.result])

    })
  })

  describe('RegisterPlayerMessage', () => {
    it('registers player in game', async () => {
      const state: GameState = new GameState({ arena })
      const session: Session = createSession()
      const message: RegisterPlayerMessage = {
        data: {
          id: 'player-1'
        },
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        }
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
            }
          }
        },
        state
      } as const
      sandbox.stub(handlers.Request, 'RegisterPlayer').returns(result)

      const { results } = await loop(state, [{ session, message }])

      expect(handlers.Request.RegisterPlayer).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('MovePlayerMessage', () => {
    it('moves player', async () => {
      const state: GameState = new GameState({ arena })
      const session: Session = createSession()
      const message: MovePlayerMessage = {
        data: {
          movement: {
            direction: 'forward'
          }
        },
        sys: {
          type: 'Request',
          id: 'MovePlayer'
        }
      }
      const result = {
        result: {
          success: true,
          request: RequestType.MovePlayer,
          details: {
            id: 'player-1',
            position: {
              x: 1,
              y: 1
            }
          }
        }, state
      } as const
      sandbox.stub(handlers.Request, 'MovePlayer').returns(result)

      const { results } = await loop(state, [{ session, message }])

      expect(handlers.Request.MovePlayer).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  describe('ShootMessage', () => {
    it('shoots', async () => {
      const state: GameState = new GameState({ arena })
      const session: Session = createSession()
      const message: ShootMessage = {
        sys: {
          type: 'Request',
          id: 'Shoot' // TODO fix the messages typings. Here I could have RegisterPlayer and the type would not complain
        }
      }
      const result = {
        result: {
          success: true,
          request: RequestType.Shoot,
          details: {
            id: 'player-1'
          }
        }, state
      } as const
      sandbox.stub(handlers.Request, 'Shoot').returns(result)

      const { results } = await loop(state, [{ session, message }])

      expect(handlers.Request.Shoot).to.have.been.calledOnceWith(session, message, state)
      expect(results).to.eql([result.result])
    })
  })

  // TODO maybe remove this test
  describe('when the game is not started', () => {
    it('does not send update notifications', async () => {
      const state: GameState = new GameState({ arena })
      const { updates } = await loop(state, [])

      expect(updates).to.be.empty
    })
  })

  describe.skip('when the game is started', () => {
    describe('players', () => {
      it('returns "GameUpdate"s', async () => {
        const player = createPlayer({ id: 'player-1' })
        const state: GameState = new GameState({ arena })
        state.registerPlayer(player)
        state.started = true

        const { updates } = await loop(state, [])

        expect(updates).to.have.lengthOf(1)
        expect(updates[0]).to.eql({
          player,
          payload: {
            sys: 'GameUpdate',
            data: {
              life: 100
            }
          }
        })
      })
    })
  })
})
