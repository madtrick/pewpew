export default interface Config {
  autoStartGame: boolean
  turboMultiplierFactor: number
  maxTokensPerPlayer: number
  initialTokensPerPlayer: number
  tokenIncreaseFactor: number
  movementSpeeds: {
    player: number
    shot: number
  }
  costs: {
    playerMovementTurbo: number
    playerShot: number
    playerDeployMine: number
  }
}
