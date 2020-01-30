import Config from '../src/config'

export const config: Config = {
  autoStartGame: false,
  turboMultiplierFactor: 2,
  movementSpeeds: {
    player: 1,
    shot: 1
  },
  costs: {
    playerMovementTurbo: 2,
    playerShot: 3,
    playerDeployMine: 3
  }
}
