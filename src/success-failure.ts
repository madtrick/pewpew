export type Success<T> = { status: 'ok', data: T }
export type Failure<F> = { status: 'ko', data: F }
export type Result<T, F> = Success<T> | Failure<F>

export function isSuccess<T, F> (result: Result<T, F>): result is Success<T> {
  return result.status === 'ok'
}

export function isFailure<T, F> (result: Result<T, F>): result is Failure<F> {
  return result.status === 'ko'
}

export function success<T> (data: T): Success<T> {
  return { status: 'ok', data }
}

export function failure<F> (data: F): Failure<F> {
  return { status: 'ko', data }
}

export function asSuccess<T, F> (result: Result<T, F>): T | never {
  if (result.status === 'ok') {
    return result.data
  }

  // TODO include the failure details in the thrown error
  throw new Error('Expected a Success got a Failure')
}
