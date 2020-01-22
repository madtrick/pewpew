/*
 * Round with 5 decimal digits
 */
export function round (value: number): number {
  const multiplier = Math.pow(10, 5)

  return Math.round(multiplier * value) / multiplier
}

