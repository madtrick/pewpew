import { expect } from 'chai'
import { RegisterPlayerMessage } from '../../../../src/messages'
import { GameState } from '../../../../src/game-state'
import { createPlayer } from '../../../../src/player'
import { createSession } from '../../../../src/session'
import { Arena } from '../../../../src/components/arena'
import { RequestType } from '../../../../src/message-handlers'
import { scan } from '../../../../src/components/radar'
import handler, { RegisterPlayerResultDetails } from '../../../../src/message-handlers/requests/register-player'

describe('Requests - Register player', () => {
  const arena = new Arena({ width: 100, height: 100 }, { radar: scan })
  const gameStateOptions = { arena }

  // TODO throw if the game has already started
  describe('when the game has not started', () => {
    it('registers player in game', () => {
      const state: GameState = new GameState(gameStateOptions)
      const session = createSession()
      const message: RegisterPlayerMessage = {
        data: {
          id: 'player-1'
        },
        type: 'Request',
        id: 'RegisterPlayer'
      }

      const { result, state: newState } = handler(session, message, state)
      const [player] = newState.players()

      expect(newState.players()).to.have.lengthOf(1)
      expect(result).to.deep.include({
        success: true,
        request: RequestType.RegisterPlayer
      })

      // Can't use a matcher in the expectation above
      // to verify that the position object is present and
      // with numeric values for x and y
      //
      // So I've to do all this manual property testing here
      //
      // We need this https://github.com/chaijs/chai/issues/644
      if (result.success === true) {
        // NOTE I've to move this expectation here because
        // `deep.include` does not support partial matching of
        // nested objects
        expect(result.details.id).to.eql('player-1')

        // TODO fix the typing of the handler so
        // I don't have to do this casting here. The problem is
        // that the current typings of the handler have an union
        // type for the `result` property. That union includes the
        // types of all the return type from all the handlers

        // NOTE can't use .finite from chai as it's not part of the typing definitions
        expect((result.details as RegisterPlayerResultDetails).position.x).to.be.a('number')
        expect((result.details as RegisterPlayerResultDetails).position.y).to.be.a('number')
      }
      expect(session.playerId).to.eql(player.id)
    })

    it('does not register player in game if duplicated id', () => {
      const player = createPlayer({ id: 'player-1'})
      const state: GameState = new GameState(gameStateOptions)
      const session = createSession()
      state.registerPlayer(player)
      const message: RegisterPlayerMessage = {
        data: {
          id: 'player-1'
        },
        type: 'Request',
        id: 'RegisterPlayer'
      }

      const { result, state: newState } = handler(session, message, state)

      expect(newState.players()).to.have.lengthOf(1)
      expect(result).to.eql({
        session,
        success: false,
        reason: 'Player already registered with id player-1',
        request: RequestType.RegisterPlayer
      })
      expect(session.playerId).to.be.undefined
    })
  })
})

