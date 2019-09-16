import { expect } from 'chai'
import { createTicker } from '../../src/ticker'

function sleep (ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value?: T) => void
}

function createDeferred<T> (): Deferred<T> {
  let resolver: (value?: T) => void = () => undefined
  const promise = new Promise<T>((resolve) => {
    resolver = resolve
  })

  return {
    promise,
    resolve: resolver
  }
}

describe.only('Ticker', () => {
  describe('.atLeastEvery', () => {
    it('calls its callback at least every given ms', async () => {
      const ticker = createTicker()

      let count = 0
      ticker.atLeastEvery(100, () => {
        count = count + 1
      })

      await sleep(350)

      ticker.cancel()
      expect(count).to.eql(3)
    })

    it('does not execute the callback before the timeout', () => {
      const ticker = createTicker()

      let count = 0
      ticker.atLeastEvery(100, () => {
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
        ticker.atLeastEvery(100, () => {
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

