import * as Bunyan from 'bunyan'
import { Logger } from '../../src/types'

export default function createLogger (options?: { enabled: boolean }): Logger {
  const logger = Bunyan.createLogger({ name: 'pewpew-tests' })
  const enabled = options && options.enabled

  return {
    info: (...args: any[]): void => {
      if (enabled) {
        logger.info(args)
      }
    },
    debug: (...args: any[]): void => {
      if (enabled) {
        logger.debug(args)
      }
    }
  }
}
