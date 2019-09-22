import * as Bunyan from 'bunyan'
import { ILogger } from '../../../src/types'

export default function createLogger (options?: { enabled: boolean }): ILogger {
  const logger = Bunyan.createLogger({ name: 'pewpew-tests' })
  const enabled = options && options.enabled

  return {
    info: (...args: any[]): void => {
      if (enabled) {
        logger.info(args)
      }
    }
  }
}
