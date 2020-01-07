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
  autoStartGame: env('AUTO_START_GAME', { isBoolean: true, default: false })
};
