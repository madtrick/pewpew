interface Ticker {
  atLeastEvery: (ms: number, fn: () => void) => undefined
  cancel: () => void
}

type TickerRef = any
export function createTicker (): Ticker {
  let timeout: NodeJS.Timeout
  let cancel = false

  const ticker = {
    atLeastEvery: (ms: number, fn: () => void): TickerRef => {
      if (cancel) {
        clearTimeout(timeout)
        return
      }

      timeout = setTimeout(async () => {
        await fn()

        ticker.atLeastEvery(ms, fn)
      }, ms)

      return timeout
    },

    cancel: () => {
      cancel = true
    }
  }

  return ticker
}
