export interface Ticker {
  atLeastEvery: (ms: number, fn: (currentTick: number) => Promise<void>) => void
  cancel: () => void
}

export function createTicker (): Ticker {
  let timeout: NodeJS.Timeout
  let currentTick = 0
  let cancelled = false

  const ticker = {
    atLeastEvery: (ms: number, fn: (currentTick: number) => Promise<void>): void => {
      currentTick = currentTick + 1

      timeout = setTimeout(async () => {
        await fn(currentTick)

        if (!cancelled) {
          ticker.atLeastEvery(ms, fn)
        }
      }, ms)
    },

    cancel: () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }

  return ticker
}
