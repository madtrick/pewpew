import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, Success, Result, asSuccess, ComponentType, UpdateType } from '../../../src/components/arena'
import { Player, createPlayer } from '../../../src/player'
import { createShot } from '../../../src/shot'

function makeSuccess<T>(data: T): Success<T> {
  return { ...data, status: 'ok' }
}

enum DisplacementDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward'
}

type MovementTestOptions<T, F>= {
  arena: () => Arena,
  initialPosition: { x: number, y: number },
  // TODO temporary type while I don't figure out if
  // rotations are also considered a Movement or something else
  movements: ({ type: 'displacement', direction: DisplacementDirection } | { type: 'rotation', degrees: number })[],
  expectedResponses: Result<T, F>[]
}
function movementTest<T, F>(options: MovementTestOptions<T, F>): () => Promise<void> {
  return async () => {
    const arena = options.arena()
    const player = createPlayer({ id: 'player-1' })
    arena.registerPlayer(player, { position: options.initialPosition })
    player.rotation = 0

    const results = options.movements.map((movement) => {
      if (movement.type === 'rotation') {
        player.rotation = movement.degrees
        return
      }

      return asSuccess(arena.movePlayer(movement, player))
    }).filter(Boolean)

    results.forEach((result, index) => expect(result).to.eql(options.expectedResponses[index]))
  }
}

describe('Arena', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('registerPlayer', () => {
    let player: Player
    let arena: Arena

    beforeEach(() => {
      player = createPlayer({ id: 'player-1' })
      arena = new Arena({ width: 100, height: 100 })
    })

    describe('avoids positions on the arena edges', () => {
      it('for random value 1 for "x"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(1)
        randomStub.onCall(1).returns(0.5)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.player.position
        expect(x).to.eql(84)
        expect(y).to.eql(50)
      })

      it('for random value 0 for "x"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0)
        randomStub.onCall(1).returns(0.5)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.player.position
        expect(x).to.eql(16)
        expect(y).to.eql(50)
      })

      it('for random value 1 for "y"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0.50)
        randomStub.onCall(1).returns(1)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.player.position
        expect(x).to.eql(50)
        expect(y).to.eql(84)
      })

      it('for random value 0 for "y"', () => {
        const randomStub = sandbox.stub(Math, 'random')

        randomStub.onCall(0).returns(0.50)
        randomStub.onCall(1).returns(0)

        const result = asSuccess(arena.registerPlayer(player))

        const { x, y } = result.player.position
        expect(x).to.eql(50)
        expect(y).to.eql(16)
      })
    })

    it('avoids collisions with existing players', () => {
      const randomStub = sandbox.stub(Math, 'random')

      // This will set the player on x: 50, y: 50
      randomStub.onCall(0).returns(0.5)
      randomStub.onCall(1).returns(0.5)

      arena.registerPlayer(player)

      randomStub.reset()
      randomStub.onCall(0).returns(0.5)
      randomStub.onCall(1).returns(0.5)
      // This will set the player on x: 16, y: 16
      randomStub.onCall(2).returns(0)
      randomStub.onCall(3).returns(0)

      const newPlayer = createPlayer({ id: 'player-2' })
      const result = asSuccess(arena.registerPlayer(newPlayer))

      const { x, y } = result.player.position
      expect(x).to.eql(16)
      expect(y).to.eql(16)
    })

    describe('options', () => {
      describe('position', () => {
        it('places the player in the given position', () => {
          const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))

          const { x, y } = registeredPlayer.position
          expect(x).to.eql(50)
          expect(y).to.eql(50)
        })

        it('rejects the registration if the position is outside the arena boundaries (right)', () => {
          const { status } = arena.registerPlayer(player, { position: { x: 300, y: 50 } })

          expect(status).to.eql('ko')
        })

        it('rejects the registration if the position collides with another player', () => {
          const secondPlayer = createPlayer({ id: 'player-2' })
          arena.registerPlayer(secondPlayer, { position: { x: 50, y: 50 } })
          const { status } = arena.registerPlayer(player, { position: { x: 60, y: 50 } })

          expect(status).to.eql('ko')
        })
      })
    })
  })

  describe('movePlayer', () => {
    let arena: Arena

    beforeEach(() => {
      arena = new Arena({ width: 100, height: 100 })
    })

    it('moves the player - horizontally', movementTest({
      movements: [
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }
      ],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 51, y: 50 } }),
        makeSuccess({ position: { x: 50, y: 50 } })
      ]
    }))

    it('moves the player - vertically', movementTest({
      movements: [
        { type: 'rotation', degrees: 90 },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50, y: 49 } })
      ]
    }))

    it('moves the player - at an angle', movementTest({
      movements: [
        { type: 'rotation', degrees: 30 },
        { type: 'displacement', direction: DisplacementDirection.FORWARD }],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50.86603, y: 50.5 } })
      ]
    }))

    it('moves the player - at an angle', movementTest({
      movements: [
        { type: 'rotation', degrees: 30 },
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
        { type: 'displacement', direction: DisplacementDirection.BACKWARD }
      ],
      arena: () => arena,
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50.86603, y: 50.5 } }),
        makeSuccess({ position: { x: 50, y: 50 } })
      ]
    }))

    it('moves the player - if it does not collide with others', movementTest({
      movements: [
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
      ],
      arena: () => {
        const player = createPlayer({ id: 'player-2' })

        arena.registerPlayer(player, { position: { x: 84, y: 50 } })

        return arena
      },
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 51, y: 50 } })
      ]
    }))

    it('does not move the player - if it collides with others', movementTest({
      movements: [
        { type: 'displacement', direction: DisplacementDirection.FORWARD },
      ],
      arena: () => {
        const player = createPlayer({ id: 'player-2' })

        // 50 + 16 = 66
        // 83 - 16 = 67
        arena.registerPlayer(player, { position: { x: 83, y: 50 } })

        return arena
      },
      initialPosition: { x: 50, y: 50 },
      expectedResponses: [
        makeSuccess({ position: { x: 50, y: 50 } })
      ]
    }))
  })

  describe('registerShot', () => {
    it('creates the shot relative to the player position', () => {
      const arena = new Arena({ width: 100, height: 100 })
      const player = createPlayer({ id: 'player-1' })
      const result = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      const shot = createShot({ player: result.player })
      player.rotation = 0

      const registerShotResult = asSuccess(arena.registerShot(shot))

      // TODO maybe also return the arenaPlayer from `registerPlayer`
      expect(registerShotResult.shot.position).to.eql({ x: 67, y: 50 })
      // expect(registerShotResult.shot.position).to.eql({ x: 66, y: 50 })
    })
  })

  describe('update', () => {
    describe('shots', () => {
      let arena: Arena

      beforeEach(() => {
        arena = new Arena({ width: 100, height: 100 })
      })

      it('moves the shots', () => {
        const player = createPlayer({ id: 'player-1' })
        const result = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
        const shot = createShot({ player: result.player })
        // TODO this rotation should be set on the registered player, or passed as an optional value
        // to registerPlayer
        player.rotation = 0

        const registerShotResult = asSuccess(arena.registerShot(shot))
        const { x: initialX, y: initialY } = registerShotResult.shot.position

        for (let i = 1; i < 5; i++) {
          arena.update()

          const [shot] = arena.shots()
          const { x, y } = shot.position

          expect(x).to.eql(initialX + i)
          expect(y).to.eql(initialY)
        }
      })

      // TODO missing tests for vertically and at an angle shot movements

      describe('when the shot hits a wall', () => {
        it('destroys the shot', () => {
          // const arena = new Arena({ width: 100, height: 100 })
          const player = createPlayer({ id: 'player-1' })
          const result = asSuccess(arena.registerPlayer(player, { position: { x: 79, y: 50 } }))
          const shot = createShot({ player: result.player })
          player.rotation = 0
          arena.registerShot(shot)

          // In five movements the shot should have crossed the right wall of
          // the arena
          // TODO no need to use a loop here. We are already testing that the shot is movered
          // in another test. Remove this an instead place the shot next to the wall
          for (let i = 1; i < 6; i++) {
            arena.update()
          }

          const shots = arena.shots()
          expect(shots).to.be.empty
        })
      })

      describe('when the shot hits a player', () => {
        it('destroys the shot and reduces the life of the player', () => {
          const player1 = createPlayer({ id: 'player-1' })
          const player2 = createPlayer({ id: 'player-2' })
          const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
          const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 65, y: 50 } })).player
          const initialOtherPlayerLife = otherPlayer.life
          // TODO clarify when the hit happens. Does the hit have to cross the
          // border of the player bounding circle or is it enough if it tangential?
          shooter.rotation = 0
          otherPlayer.rotation = 0
          const shot = createShot({ player: shooter })
          arena.registerShot(shot)

          // In 4 movements the shot should be right next
          // to the player.
          // TODO no need to use a loop here. We are already testing that the shot is movered
          // in another test. Remove this an instead place the shot next to the wall
          for (let i = 1; i < 5; i++) {
            arena.update()

            const shots = arena.shots()
            expect(shots).to.not.be.empty
          }

          // After the loop the shot is at x=47. One movement more and the
          // player will be tangential to the player which is considered a hit

          arena.update()
          const shots = arena.shots()
          expect(shots).to.be.empty
          const targetPlayer = arena.findPlayer('player-2')
          expect(targetPlayer!.life).to.eql(initialOtherPlayerLife - shot.damage)
        })
      })

      it('reflects the updates in the update results', () => {
        const player1 = createPlayer({ id: 'player-1' })
        const player2 = createPlayer({ id: 'player-2' })
        const player3 = createPlayer({ id: 'player-3' })
        const player4 = createPlayer({ id: 'player-4' })
        // A shot from this shooter will to initialOtherPlayer
        const shooter1 = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
        // A shot from this shooter will hit the wall
        const shooter2 = asSuccess(arena.registerPlayer(player2, { position: { x: 83, y: 20 } })).player
        // A shot from this shooter will not hit anything
        const shooter3 = asSuccess(arena.registerPlayer(player3, { position: { x: 40, y: 80 } })).player
        const otherPlayer = asSuccess(arena.registerPlayer(player4, { position: { x: 59, y: 50 } })).player
        const initialOtherPlayerLife = otherPlayer.life
        shooter1.rotation = 0
        shooter2.rotation = 0
        shooter3.rotation = 0
        otherPlayer.rotation = 0
        const shot1 = createShot({ player: shooter1 })
        const shot2 = createShot({ player: shooter2 })
        const shot3 = createShot({ player: shooter3 })
        arena.registerShot(shot1)
        arena.registerShot(shot2)
        arena.registerShot(shot3)

        const updates = arena.update()

        expect(updates).to.have.lengthOf(3)
        expect(updates).to.have.deep.members([
          {
            type: UpdateType.Hit,
            component: {
              type: ComponentType.Player,
              data: {
                id: otherPlayer.id,
                damage: shot1.damage,
                life: initialOtherPlayerLife - shot1.damage
              }
            }
          },
          {
            type: UpdateType.Hit,
            component: {
              type: ComponentType.Wall,
              data: {
                position: {
                  x: 101,
                  y: 20
                }
              }
            }
          },
          {
            type: UpdateType.Movement,
            component: {
              type: ComponentType.Shot,
              data: {
                position: {
                  x: 58,
                  y: 80
                }
              }
            }
          }
        ])
      })
    })
  })
})

