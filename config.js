'use strict';

/*
 * Exports a configuration object built from environment varibales
 * See the README for all available configuration varibles
 */

function env (variable, options) {
  options = options || {};
  let value;
  const raw = process.env[variable]

  if (options.isNumber) {
    value = parseFloat(raw);
    if (isNaN(value)) {
      throw new Error(`Invalid number value "${raw}" for variable ${variable}`)
    }
  } else if (options.isBoolean) {
    if (raw !== undefined && !['true', 'false'].includes(raw)) {
      throw new Error(`Invalid boolean value "${raw}" for variable ${variable}`)
    }

    value = raw === 'true'
  } else {
    value = raw;
  }

  if (!('default' in options) && value === undefined) {
    throw new Error(`Missing environment variable ${variable}`)
  }


  return value || options.default;
}

function currentMode () {
  return env('NODE_ENV', { default: 'development' });
}

function isDevelopment () {
  return currentMode() === 'development';
}

module.exports = {
  autoStartGame: env('AUTO_START_GAME', { isBoolean: true, default: false }),
  turboMultiplierFactor: env('TURBO_MULTIPLIER_FACTOR', { isNumber: true }),
  movementSpeeds: {
    player: env('MOVEMENT_SPEED_PLAYER', { isNumber: true, default: false }),
    shot: env('MOVEMENT_SPEED_SHOT', { isNumber: true, default: false }),
  },
  costs: {
    // movePlayer: env('COST_MOVE_PLAYER', { isNumber: true }),
    // rotatePlayer: env('COST_ROTATE_PLAYER', { isNumber: true }),
    playerMovementTurbo: env('COST_PLAYER_MOVEMENT_TURBO', { isNumber: true }),
    playerShot: env('COST_PLAYER_SHOT', { isNumber: true }),
    playerDeployMine: env('COST_PLAYER_DEPLOY_MINE', { isNumber: true })
  }
};
