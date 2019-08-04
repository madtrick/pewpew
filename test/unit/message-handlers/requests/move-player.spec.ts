import { expect } from 'chai'
import { MovePlayerMessage } from '../../../../src/messages'
import { createGameState, GameState } from '../../../../src/game-state'
import { Player, createPlayer } from '../../../../src/player'
import handler from '../../../../src/message-handlers/requests/move-player'

// TODO: test the representation of the player in the arena
describe('Requests - Move player', () => {
  describe('when the game is started', () => {
    describe('forward movement', () => {
      it('succeeds', async () => {
        const state: GameState = createGameState()
        state.started = true
        const player: Player = createPlayer({ id: 'player-1' })
        state.players = [player]
        const message: MovePlayerMessage = {
          session: {
            uuid: 'fake-session'
          },
          payload: {
            data: {
              movements: [{ type: 'displacement', direction: 'forward' }]
            },
            sys: {
              type: 'Request',
              id: 'MovePlayer'
            }
          }
        }

        const { response } = await handler(message, state)

        expect(response).to.eql({
          data: {
            result: 'Success',
            details: {
              position: {
                x: 1,
                y: 0
              },
              rotation: 0
            }
          },
          sys: {
            type: 'Response',
            id: 'MovePlayer'
          }
        })
      })
    })

    describe('backward movement', () => {
      it('succeeds', async () => {
        const state: GameState = createGameState()
        state.started = true
        const player: Player = createPlayer({ id: 'player-1' })
        player.position.x = 2
        state.players = [player]
        const message: MovePlayerMessage = {
          session: {
            uuid: 'fake-session'
          },
          payload: {
            data: {
              movements: [{ type: 'displacement', direction: 'backward' }]
            },
            sys: {
              type: 'Request',
              id: 'MovePlayer'
            }
          }
        }

        const { response } = await handler(message, state)

        expect(response).to.eql({
          data: {
            result: 'Success',
            details: {
              position: {
                x: 1,
                y: 0
              },
              rotation: 0
            }
          },
          sys: {
            type: 'Response',
            id: 'MovePlayer'
          }
        })
      })

      describe('rotation movement', () => {
        it('succeeds', async () => {
          const state: GameState = createGameState()
          state.started = true
          const player: Player = createPlayer({ id: 'player-1' })
          state.players = [player]
          const message: MovePlayerMessage = {
            session: {
              uuid: 'fake-session'
            },
            payload: {
              data: {
                movements: [{ type: 'rotation', degrees: 90 }]
              },
              sys: {
                type: 'Request',
                id: 'MovePlayer'
              }
            }
          }

          const { response } = await handler(message, state)

          expect(response).to.eql({
            data: {
              result: 'Success',
              details: {
                position: {
                  x: 0,
                  y: 0
                },
                rotation: 90
              }
            },
            sys: {
              type: 'Response',
              id: 'MovePlayer'
            }
          })
        })
      })
    })
  })
})


