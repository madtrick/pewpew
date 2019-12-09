import { expect } from 'chai'
import * as sinon from 'sinon'
import { ShootMessage, DeployMineMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer } from '../../../../src/player'
import { Session, createSession } from '../../../../src/session'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { scan } from '../../../../src/components/radar'
import { RequestType } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/requests/deploy-mine'

describe('Requests - Deploy mine', () => {
  let arena: Arena
  let gameStateOptions: { arena: Arena } // TODO maybe export the type for this options
  let session: Session

  beforeEach(() => {
    arena = new Arena({ width: 300, height: 300 }, { radar: scan })
    gameStateOptions = { arena }

    session = createSession({ id: 'channel-1' })
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const initialMines = player.mines
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      const { result } = handler(session, message, state)

      // TODO check that the player still has the initial number of shots
      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.DeployMine
      })
      expect(player.mines).to.eql(initialMines)
      expect(arena.mines).to.be.empty
    })
  })

  describe('when the session has no player registered', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      state.started = true

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'There is no player registered for this session',
        request: RequestType.DeployMine
      })
      expect(arena.mines).to.be.empty
    })
  })

  describe.only('when the game is started and the session has a player registered', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: DeployMineMessage = {
          type: 'Request',
          id: 'DeployMine'
        }

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.DeployMine,
          reason: 'The player could not be found'
        })
        expect(arena.mines).to.be.empty
      })
    })

    it('does deploy the mine if the player has no mines left', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      registeredPlayer.mines = 0
      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'There are no mines left',
        request: RequestType.DeployMine
      })
      expect(arena.mines).to.be.empty
    })

    it('deploys the mine if the player has remaining mines (rotation < 180)', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 100, y: 74 } }))
      const initialMines = registeredPlayer.mines
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        success: true,
        request: RequestType.DeployMine,
        details: {
          id: 'player-1'
        }
      })
      expect(registeredPlayer.mines).to.eql(initialMines - 1)
      expect(arena.mines).to.have.lengthOf(1)
      expect(arena.mines[0]).to.deep.include({
        position: { x: 74, y: 74 }
      })
    })

    it('deploys the mine if the player has remaining mines (rotation >= 180)', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 100, y: 74 } }))
      const initialMines = registeredPlayer.mines
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      registeredPlayer.rotation = 180
      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state)

      expect(result).to.eql({
        success: true,
        request: RequestType.DeployMine,
        details: {
          id: 'player-1'
        }
      })
      expect(registeredPlayer.mines).to.eql(initialMines - 1)
      expect(arena.mines[0]).to.deep.include({
        position: { x: 126, y: 74 }
      })
    })
  })
})



