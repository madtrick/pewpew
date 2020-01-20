import { expect } from 'chai'
import { createTicker } from '../../src/ticker'

function sleep (ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface Deferred {
  promise: Promise<void>
  resolve: () => void
}

function createDeferred (): Deferred {
  let resolver: () => void = () => undefined
  const promise = new Promise<void>((resolve) => {
    resolver = resolve
  })

  return {
    promise,
    resolve: resolver
  }
}

describe('Ticker', () => {
  describe('.atLeastEvery', () => {
    it('calls its callback at least every given ms', async () => {
      const ticker = createTicker()

      let count = 0
      ticker.atLeastEvery(100, async () => {
        count = count + 1
      })

      await sleep(350)

      ticker.cancel()
      expect(count).to.eql(3)
    })

    it('calls its callback passing the current tick number', async () => {
      const ticker = createTicker()

      let count = 1
      ticker.atLeastEvery(100, async (tick) => {
        expect(tick).to.eql(count)
        count = count + 1
      })

      await sleep(350)

      ticker.cancel()
    })

    it('does not execute the callback before the timeout', () => {
      const ticker = createTicker()

      let count = 0
      ticker.atLeastEvery(100, async () => {
        count = count + 1
      })

      ticker.cancel()
      expect(count).to.eql(0)
    })

    describe('when the callback returns a promise', () => {
      it('does not execute the callback while the promise does not resolve', async () => {
        const ticker = createTicker()

        let count = 0
        const deferred = createDeferred()
        ticker.atLeastEvery(100, async () => {
          count = count + 1
          return deferred.promise
        })

        await sleep(500)

        deferred.resolve()

        ticker.cancel()
        expect(count).to.eql(1)
      })
    })
  })
})

