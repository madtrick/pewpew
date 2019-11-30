import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, Success, Result, asSuccess, ComponentType, UpdateType } from '../../../src/components/arena'
import { Player, createPlayer, PLAYER_MAX_LIFE } from '../../../src/player'
import { createShot } from '../../../src/shot'
import { scan, ScanResult as RadarScanResult } from '../../../src/components/radar'

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
  let arena: Arena

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    arena = new Arena({ width: 100, height: 100 }, { radar: scan })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('registerPlayer', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({ id: 'player-1' })
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
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      const shot = createShot({ player: registeredPlayer })
      registeredPlayer.rotation = 0

      const registerShotResult = asSuccess(arena.registerShot(shot))

      // TODO maybe also return the arenaPlayer from `registerPlayer`
      expect(registerShotResult.shot.position).to.eql({ x: 67, y: 50 })
      // expect(registerShotResult.shot.position).to.eql({ x: 66, y: 50 })
    })

    it('creates the shot relative to the player position (player rotation different than 0)', () => {
      const player = createPlayer({ id: 'player-1' })
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      const shot = createShot({ player: registeredPlayer })
      registeredPlayer.rotation = 45

      const registerShotResult = asSuccess(arena.registerShot(shot))

      expect(registerShotResult.shot.rotation).to.eql(45)
      expect(registerShotResult.shot.position).to.eql({ x: 62.02082, y: 62.02082 })
    })
  })

  describe('update', () => {
    // TODO missing test which tests that update result includes scan and shot movement
    let shotRefillQuantity = 1
    let shotRefillCadence = 2
    let currentTick = 1

    describe('radar', () => {
      let arena: Arena
      let scanStub: sinon.SinonStub

      beforeEach(() => {
        scanStub = sandbox.stub()
        arena = new Arena({ width: 500, height: 500 }, { radar: scanStub })
      })


      it('calls the radar for each player', () => {
        const player1 = createPlayer({ id: 'player-1' })
        const player2 = createPlayer({ id: 'player-2' })
        const registeredPlayer1 = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
        const registeredPlayer2 = asSuccess(arena.registerPlayer(player2, { position: { x: 83, y: 20 } })).player
        scanStub.returns({
          type: UpdateType.Scan,
          component: {
            type: ComponentType.Radar,
            data: {
              players: [],
              unknown: []
            }
          }
        })

        arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })

        expect(scanStub).to.have.been.calledTwice
        expect(scanStub).to.have.been.calledWith(registeredPlayer1.position, [...arena.players(), ...arena.shots()])
        expect(scanStub).to.have.been.calledWith(registeredPlayer2.position, [...arena.players(), ...arena.shots()])
      })

      it('includes the results from the radar scan in the update result', () => {
        const player1 = createPlayer({ id: 'player-1' })
        asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
        const scanResult = {
          type: UpdateType.Scan,
          component: {
            type: ComponentType.Radar,
            data: {
              playerId: 'player-1',
              players: [{
                position: {
                  x: 100,
                  y: 200
                }
              }],
              unknown: [],
              shots: []
            }
          }
        }
        scanStub.returns(scanResult)

        const result = arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })
        expect(result).to.deep.include(scanResult)
      })
    })

    describe('shots', () => {
      let arena: Arena
      let scanStub: sinon.SinonStub
      let fakeScanResult: RadarScanResult = {
        type: UpdateType.Scan,
        component: {
          type: ComponentType.Radar,
          data: {
            players: [],
            unknown: [],
            shots: []
          }
        }
      }
      const fakeArenaRadarScanResult = (playerId: string) => {
        return {
          type: fakeScanResult.type,
          component: {
            type: fakeScanResult.component.type,
            data: {
              playerId,
              players: fakeScanResult.component.data.players,
              unknown: fakeScanResult.component.data.unknown,
              shots: fakeScanResult.component.data.shots
            }
          }
        }
      }

      beforeEach(() => {
        scanStub = sandbox.stub().returns(fakeScanResult)
        arena = new Arena({ width: 100, height: 100 }, { radar: scanStub })
      })

      // TODO the shot logic should be moved to a separate module so we can test separately
      // and also stub that module for easier tests
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
          arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })
          currentTick = currentTick + 1

          const [shot] = arena.shots()
          const { x, y } = shot.position

          expect(x).to.eql(initialX + i)
          expect(y).to.eql(initialY)
        }
      })

      it('moves the shots with rotation different than 0', () => {
        const player = createPlayer({ id: 'player-1' })
        const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
        const shot = createShot({ player: registeredPlayer })
        // TODO this rotation should be set on the registered player, or passed as an optional value
        // to registerPlayer
        registeredPlayer.rotation = 45
        asSuccess(arena.registerShot(shot))

        arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })

        const [arenaShot] = arena.shots()
        const { x, y } = arenaShot.position

        expect(x).to.eql(62.72793)
        expect(y).to.eql(62.72793)
      })

      // TODO missing tests for vertically and at an angle shot movements

      describe('when the shot hits a wall', () => {
        it('destroys the shot', () => {
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
            arena.update({ shotRefillQuantity, shotRefillCadence, currentTick })
            currentTick = currentTick + 1
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
            arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })
            currentTick = currentTick + 1

            const shots = arena.shots()
            expect(shots).to.not.be.empty
          }

          // After the loop the shot is at x=47. One movement more and the
          // player will be tangential to the player which is considered a hit

          arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })
          const shots = arena.shots()
          expect(shots).to.be.empty
          const targetPlayer = arena.findPlayer('player-2')
          expect(targetPlayer!.life).to.eql(initialOtherPlayerLife - shot.damage)
        })

        describe('when the shot hits and destroys a player', () => {
          it('foo', () => {
            const player1 = createPlayer({ id: 'player-1' })
            const player2 = createPlayer({ id: 'player-2' })
            const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 31, y: 50 } })).player
            const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 65, y: 50 } })).player

            shooter.rotation = 0
            otherPlayer.rotation = 0
            otherPlayer.life = PLAYER_MAX_LIFE - (PLAYER_MAX_LIFE - 1)
            const shot = createShot({ player: shooter })
            arena.registerShot(shot)

            // After the loop the shot is at x=47. One movement more and the
            // player will be tangential to the player which is considered a hit

            arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })
            const targetPlayer = arena.findPlayer('player-2')
            expect(targetPlayer).to.be.undefined
          })
        })
      })

      describe('update results', () => {
        it('reflects the hit on a player', () => {
          const player1 = createPlayer({ id: 'player-1' })
          const player2 = createPlayer({ id: 'player-2' })
          // A shot from this shooter will hit otherPlayer
          const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
          const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 59, y: 50 } })).player
          const initialLifeOtherPlayer = otherPlayer.life
          shooter.rotation = 0
          otherPlayer.rotation = 0
          const shot1 = createShot({ player: shooter })
          arena.registerShot(shot1)

          const updates = arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })

          expect(updates).to.have.lengthOf(3)
          expect(updates).to.have.deep.members([
            {
              type: UpdateType.Hit,
              component: {
                type: ComponentType.Player,
                data: {
                  id: otherPlayer.id,
                  damage: shot1.damage,
                  life: initialLifeOtherPlayer - shot1.damage,
                  shotId: shot1.id
                }
              }
            },
            fakeArenaRadarScanResult('player-1'),
            fakeArenaRadarScanResult('player-2')
          ])
        })

        it('reflects the a player destroyed', () => {
          const player1 = createPlayer({ id: 'player-1' })
          const player2 = createPlayer({ id: 'player-2' })
          // A shot from this shooter will hit otherPlayer
          const shooter = asSuccess(arena.registerPlayer(player1, { position: { x: 26, y: 50 } })).player
          const otherPlayer = asSuccess(arena.registerPlayer(player2, { position: { x: 59, y: 50 } })).player
          shooter.rotation = 0
          otherPlayer.rotation = 0
          otherPlayer.life = PLAYER_MAX_LIFE - PLAYER_MAX_LIFE + 1

          const shot1 = createShot({ player: shooter })
          arena.registerShot(shot1)

          const updates = arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })

          expect(updates).to.have.lengthOf(3)
          expect(updates).to.have.deep.members([
            {
              type: UpdateType.Hit,
              component: {
                type: ComponentType.Player,
                data: {
                  id: otherPlayer.id,
                  damage: shot1.damage,
                  life: 0,
                  shotId: shot1.id
                }
              }
            },
            {
              type: UpdateType.PlayerDestroyed,
              component: {
                type: ComponentType.DestroyedPlayer,
                data: {
                  id: otherPlayer.id
                }
              }
            },
            fakeArenaRadarScanResult('player-1')
          ])
        })

        it('reflects the hit on a wall', () => {
          const player = createPlayer({ id: 'player-1' })
          // A shot from this shooter will hit the wall
          const shooter = asSuccess(arena.registerPlayer(player, { position: { x: 83, y: 20 } })).player
          shooter.rotation = 0
          const shot = createShot({ player: shooter })
          arena.registerShot(shot)

          const updates = arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })

          expect(updates).to.have.lengthOf(2)
          expect(updates).to.have.deep.members([
            {
              type: UpdateType.Hit,
              component: {
                type: ComponentType.Wall,
                data: {
                  position: {
                    x: 101,
                    y: 20
                  },
                  shotId: shot.id
                }
              }
            },
            fakeArenaRadarScanResult('player-1')
          ])
        })

        it('reflects a shot movement', () => {
          const player1 = createPlayer({ id: 'player-1' })
          // A shot from this shooter will not hit anything
          const shooter1 = asSuccess(arena.registerPlayer(player1, { position: { x: 40, y: 80 } })).player
          shooter1.rotation = 0
          const shot = createShot({ player: shooter1 })
          arena.registerShot(shot)

          const updates = arena.update({ shotRefillCadence, shotRefillQuantity, currentTick })


          expect(updates).to.have.lengthOf(2)
          expect(updates).to.have.deep.members([
            {
              type: UpdateType.Movement,
              component: {
                type: ComponentType.Shot,
                data: {
                  position: {
                    x: 58,
                    y: 80
                  },
                  id: shot.id
                }
              }
            },
            fakeArenaRadarScanResult('player-1')
          ])
        })
      })
    })
  })
})

