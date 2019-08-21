import { expect } from 'chai'
import { RegisterPlayerMessage } from '../../src/messages'
import { GameState } from '../../src/game-state'
import { handlers } from '../../src/message-handlers'
import { Arena } from '../../src/components/arena'
import { createPlayer } from '../../src/player'
import createGameLopp from '../../src/game-loop'

describe('Game loop', () => {
  const loop = createGameLopp(handlers)
  const arena = new Arena({ width: 100, height: 100 })

  it('registers player in game', async () => {
      const state: GameState = new GameState({ arena })
      const message: RegisterPlayerMessage = {
        session: {
          uuid: 'fake-session'
        },
        payload: {
          data: {
            id: 'player-1'
          },
          sys: {
            type: 'Request',
            id: 'RegisterPlayer'
          }
        }
      }

      const { responses: [ response ], state: newState } = await loop(state, [message])

      expect(newState.players()).to.not.be.empty
      expect(response).to.eql({
        data: {
          result: 'Success',
        },
        sys: {
          type: 'Response',
          id: 'RegisterPlayer'
        }
      })
  })

  // TODO maybe remove this test
  it('does not register player in game if duplicated id', async () => {
    const player = createPlayer({ id: 'player-1' })
    const state: GameState = new GameState({ arena })
    state.registerPlayer(player)
    const message: RegisterPlayerMessage = {
      session: {
        uuid: 'fake-session'
      },
      payload: {
        data: {
          id: 'player-1'
        },
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        }
      }
    }

    const { responses: [ response ], state: newState } = await loop(state, [message])

    expect(newState.players()).to.have.lengthOf(1)
    expect(response).to.eql({
      data: {
        msg: 'Player already registered with id player-1',
        result: 'Failure'
      },
      sys: {
        type: 'Response',
        id: 'RegisterPlayer'
      }
    })
  })

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
