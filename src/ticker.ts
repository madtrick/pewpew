export interface Ticker {
  atLeastEvery: (ms: number, fn: (currentTick: number) => Promise<void>) => void
  cancel: () => void
}

export function createTicker (): Ticker {
  let timeout: NodeJS.Timeout
  let cancel = false
  let currentTick = 0

  const ticker = {
    atLeastEvery: (ms: number, fn: (currentTick: number) => Promise<void>): void => {
      if (cancel) {
        clearTimeout(timeout)
      }

      currentTick = currentTick + 1

      timeout = setTimeout(async () => {
        await fn(currentTick)

        ticker.atLeastEvery(ms, fn)
      }, ms)
    },

    cancel: () => {
      cancel = true
    }
  }

  return ticker
}
