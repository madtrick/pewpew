import { expect } from 'chai'
import { DeployMineMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer, PLAYER_RADIUS } from '../../../../src/player'
import { Session, createSession } from '../../../../src/session'
import { Arena, asSuccess } from '../../../../src/components/arena'
import { scan } from '../../../../src/components/radar'
import { RequestType } from '../../../../src/message-handlers'
import handler from '../../../../src/message-handlers/requests/deploy-mine'
import { config } from '../../../config'

describe('Requests - Deploy mine', () => {
  let arena: Arena
  let gameStateOptions: { arena: Arena } // TODO maybe export the type for this options
  let session: Session
  const playerDeployMineCostInTokens = config.costs.playerDeployMine

  beforeEach(() => {
    arena = new Arena({ width: 300, height: 300 }, { radar: scan })
    gameStateOptions = { arena }

    session = createSession({ id: 'channel-1' })
  })

  describe('when the game has not started', () => {
    it('rejects the request', () => {
      const state: GameState = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const initialTokens = player.tokens
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'The game has not started',
        request: RequestType.DeployMine
      })
      expect(player.tokens).to.eql(initialTokens)
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

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'There is no player registered for this session',
        request: RequestType.DeployMine
      })
      expect(arena.mines).to.be.empty
    })
  })

  describe('when the game is started and the session has a player registered', () => {
    describe('when the player can not be found', () => {
      it('rejects the request', () => {
        const state: GameState = new GameState({ arena })
        const message: DeployMineMessage = {
          type: 'Request',
          id: 'DeployMine'
        }

        state.started = true
        session.playerId = 'some-player-id'

        const { result } = handler(session, message, state, config)

        expect(result).to.eql({
          session,
          success: false,
          request: RequestType.DeployMine,
          reason: 'The player could not be found'
        })
        expect(arena.mines).to.be.empty
      })
    })

    it('does not deploy the mine if the player has not enough tokens', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player))
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      registeredPlayer.tokens = 0
      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        reason: 'Not enough tokens to deploy a mine',
        request: RequestType.DeployMine
      })
      expect(arena.mines).to.be.empty
    })

    it('deploys the mine if the player has enough tokens (rotation < 180)', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 100, y: 74 } }))
      const initialTokens = registeredPlayer.tokens
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(registeredPlayer.tokens).to.eql(initialTokens - playerDeployMineCostInTokens)
      expect(arena.mines).to.have.lengthOf(1)
      const [mine] = arena.mines
      expect(mine).to.deep.include({
        position: { x: 74, y: 74 }
      })
      expect(result).to.eql({
        success: true,
        request: RequestType.DeployMine,
        details: {
          playerId: 'player-1',
          id: mine.id,
          position: mine.position,
          remainingTokens: initialTokens - playerDeployMineCostInTokens,
          requestCostInTokens: playerDeployMineCostInTokens
        }
      })
    })

    it('deploys the mine if the player has enough tokens (rotation >= 180)', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 100, y: 74 } }))
      const initialTokens = registeredPlayer.tokens
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      registeredPlayer.rotation = 180
      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(registeredPlayer.tokens).to.eql(initialTokens - playerDeployMineCostInTokens)
      const [mine] = arena.mines
      expect(mine).to.deep.include({
        position: { x: 126, y: 74 }
      })
      expect(result).to.eql({
        success: true,
        request: RequestType.DeployMine,
        details: {
          playerId: 'player-1',
          id: mine.id,
          position: mine.position,
          remainingTokens: initialTokens - playerDeployMineCostInTokens,
          requestCostInTokens: playerDeployMineCostInTokens
        }
      })
    })

    it('does not deploy the mine if the mine would be outside of the arena', () => {
      const state = new GameState(gameStateOptions)
      const player = createPlayer({ id: 'player-1' })
      // Position the player besides the left vertical edge of the
      // arena so that there's no place to deploy a mine
      const playerPosition = {
        position: {
          x: PLAYER_RADIUS + 5,
          y: 74
        }
      }
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, playerPosition))
      const initialTokens = registeredPlayer.tokens
      const initialArenaMines = arena.mines
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      session.playerId = registeredPlayer.id
      state.started = true

      const { result } = handler(session, message, state, config)

      expect(result).to.eql({
        session,
        success: false,
        request: RequestType.DeployMine,
        reason: 'The mine can not be deployed'
      })
      expect(registeredPlayer.tokens).to.eql(initialTokens)
      expect(arena.mines).to.eql(initialArenaMines)
    })
  })
})
