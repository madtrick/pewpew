import Config from '../src/config'

export const config: Config = {
  autoStartGame: false,
  turboMultiplierFactor: 2,
  maxTokensPerPlayer: 200,
  initialTokensPerPlayer: 100,
  tokenIncreaseFactor: 1,
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
