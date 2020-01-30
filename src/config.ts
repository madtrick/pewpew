export default interface Config {
  autoStartGame: boolean
  turboMultiplierFactor: number
  movementSpeeds: {
    player: number
    shot: number
  }
  costs: {
    rotatePlayer: number
    movePlayer: number
    playerMovementTurbo: number
    playerShot: number
    playerDeployMine: number
  }
}
