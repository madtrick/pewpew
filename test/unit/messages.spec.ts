import { expect } from 'chai'
import {
  RegisterPlayerMessage,
  MovePlayerMessage,
  RotatePlayerMessage,
  ShootMessage,
  StartGameMessage,
  DeployMineMessage,
  validateMessage
} from '../../src/messages'
import VERSION from '../../src/version'

describe('Messages', () => {
  describe('validatMessage', () => {
    it('returns true for valid StartGame messages', () => {
      const message: StartGameMessage = {
        type: 'Command',
        id: 'StartGame'
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid RegisterPlayer messages', () => {
      const message: RegisterPlayerMessage = {
        type: 'Request',
        id: 'RegisterPlayer',
        data: {
          game: {
            version: VERSION
          },
          id: 'player-1'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns false for invalid RegisterPlayer messages', () => {
      const message = {
        type: 'Request',
        id: 'RegisterPlayer'
      }

      const result = validateMessage(message)

      expect(result).to.be.false
    })

    it('returns true for valid MovePlayer messages (forward direction)', () => {
      const message: MovePlayerMessage = {
        type: 'Request',
        id: 'MovePlayer',
        data: {
          movement: {
            direction: 'forward'
          }
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid MovePlayer messages (with turbo)', () => {
      const message: MovePlayerMessage = {
        type: 'Request',
        id: 'MovePlayer',
        data: {
          movement: {
            direction: 'forward',
            withTurbo: true
          }
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid MovePlayer messages (backward direction)', () => {
      const message: MovePlayerMessage = {
        type: 'Request',
        id: 'MovePlayer',
        data: {
          movement: {
            direction: 'backward'
          }
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid Shoot messages', () => {
      const message: ShootMessage = {
        type: 'Request',
        id: 'Shoot'
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid RotatePlayer messages', () => {
      const message: RotatePlayerMessage = {
        type: 'Request',
        id: 'RotatePlayer',
        data: {
          rotation: 120
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid DeployMine messages', () => {
      const message: DeployMineMessage = {
        type: 'Request',
        id: 'DeployMine'
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns false for invalid messages', () => {
      const message = {
        type: 'Request',
        id: 'Foo'
      }

      const result = validateMessage(message)

      expect(result).to.be.false
    })
  })
})

