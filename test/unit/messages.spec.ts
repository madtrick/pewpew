import { expect } from 'chai'
import {
  RegisterPlayerMessage,
  MovePlayerMessage,
  RotatePlayerMessage,
  ShootMessage,
  StartGameMessage,
  validateMessage
} from '../../src/messages'

describe('Messages', () => {
  describe('validatMessage', () => {
    it('returns true for valid StartGame messages', () => {
      const message: StartGameMessage = {
        sys: {
          type: 'Command',
          id: 'StartGame'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid RegisterPlayer messages', () => {
      const message: RegisterPlayerMessage = {
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        },
        data: {
          id: 'player-1'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns false for invalid RegisterPlayer messages', () => {
      const message = {
        sys: {
          type: 'Request',
          id: 'RegisterPlayer'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.false
    })

    it('returns true for valid MovePlayer messages (forward direction)', () => {
      const message: MovePlayerMessage = {
        sys: {
          type: 'Request',
          id: 'MovePlayer'
        },
        data: {
          movement: {
            direction: 'forward'
          }
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid MovePlayer messages (backward direction)', () => {
      const message: MovePlayerMessage = {
        sys: {
          type: 'Request',
          id: 'MovePlayer'
        },
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
        sys: {
          type: 'Request',
          id: 'Shoot'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns true for valid RotatePlayer messages', () => {
      const message: RotatePlayerMessage = {
        sys: {
          type: 'Request',
          id: 'RotatePlayer',
        },
        data: {
          rotation: 120
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.true
    })

    it('returns false for invalid messages', () => {
      const message = {
        sys: {
          type: 'Request',
          id: 'Foo'
        }
      }

      const result = validateMessage(message)

      expect(result).to.be.false
    })
  })
})

