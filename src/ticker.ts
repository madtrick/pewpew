export interface Ticker {
  atLeastEvery: (ms: number, fn: () => void) => void
  cancel: () => void
}

export function createTicker (): Ticker {
  let timeout: NodeJS.Timeout
  let cancel = false

  const ticker = {
    atLeastEvery: (ms: number, fn: () => void): void => {
      if (cancel) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(async () => {
        await fn()

        ticker.atLeastEvery(ms, fn)
      }, ms)
    },

    cancel: () => {
      cancel = true
    }
  }

  return ticker
}
