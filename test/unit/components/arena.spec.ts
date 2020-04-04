import { expect } from 'chai'
import * as sinon from 'sinon'
import { Arena, asSuccess } from '../../../src/components/arena'
import { Player, createPlayer } from '../../../src/player'
import { createShot } from '../../../src/shot'
import { config } from '../../config'

describe('Arena', () => {
  let sandbox: sinon.SinonSandbox
  let arena: Arena

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    arena = new Arena({ width: 100, height: 100 })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('removePlayer', () => {
    it('removes the player from the arena', () => {
      const player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
      arena.registerPlayer(player)
      arena.removePlayer(player)

      expect(arena.players()).to.be.empty
    })
  })

  describe('registerPlayer', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
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

      const newPlayer = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })
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
          const secondPlayer = createPlayer({ id: 'player-2', initialTokens: config.initialTokensPerPlayer })
          arena.registerPlayer(secondPlayer, { position: { x: 50, y: 50 } })
          const { status } = arena.registerPlayer(player, { position: { x: 60, y: 50 } })

          expect(status).to.eql('ko')
        })
      })
    })
  })

  describe('registerShot', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer({ id: 'player-1', initialTokens: config.initialTokensPerPlayer })
    })

    it('creates the shot relative to the player position', () => {
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      const shot = createShot({ player: registeredPlayer })
      registeredPlayer.rotation = 0

      const registerShotResult = asSuccess(arena.registerShot(shot))

      // TODO maybe also return the arenaPlayer from `registerPlayer`
      expect(registerShotResult.shot.position).to.eql({ x: 67, y: 50 })
      // expect(registerShotResult.shot.position).to.eql({ x: 66, y: 50 })
    })

    it('creates the shot relative to the player position (player rotation different than 0)', () => {
      const { player: registeredPlayer } = asSuccess(arena.registerPlayer(player, { position: { x: 50, y: 50 } }))
      const shot = createShot({ player: registeredPlayer })
      registeredPlayer.rotation = 45

      const registerShotResult = asSuccess(arena.registerShot(shot))

      expect(registerShotResult.shot.rotation).to.eql(45)
      expect(registerShotResult.shot.position).to.eql({ x: 62.02082, y: 62.02082 })
    })
  })
})
