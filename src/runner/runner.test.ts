import { describe, it, expect } from 'vitest'
import { deepEqual } from './deepEqual'
import { runCases } from './harness'
import type { TestCase } from './types'

const sampleQuestion = {
  cases: [
    { args: [1, 2], expected: 3, hidden: false },
    { args: [-1, 5], expected: 4, hidden: false },
    { args: [0, 0], expected: 0, hidden: true },
  ] as TestCase<number>[],
}

describe('deepEqual', () => {
  it('matches ints and floats within tolerance', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1.0000001, 1)).toBe(true)
    expect(deepEqual(1.5, 1.5)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
  })

  it('matches strings, booleans and null', () => {
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual('a', 'b')).toBe(false)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(true, false)).toBe(false)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('matches arrays and nested objects', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('matches NaN', () => {
    expect(deepEqual(NaN, NaN)).toBe(true)
  })
})

describe('runCases harness', () => {
  it('runs each case and reports pass/fail', async () => {
    const fn = async (args: number[]) => args[0] + args[1]
    const result = await runCases(
      { code: '', functionName: 'add', cases: sampleQuestion.cases, language: 'javascript' },
      fn,
    )
    expect(result.cases).toHaveLength(3)
    expect(result.cases[0].passed).toBe(true)
    expect(result.cases[1].passed).toBe(true)
    expect(result.cases[2].passed).toBe(true)
    // Hidden cases expose only pass/fail.
    expect(result.cases[2].actual).toBeUndefined()
    expect(result.cases[2].error).toBeUndefined()
  })

  it('reports failures and errors', async () => {
    const fn = async (args: number[]) => args[0] - args[1]
    const result = await runCases(
      { code: '', functionName: 'sub', cases: sampleQuestion.cases, language: 'javascript' },
      fn,
    )
    expect(result.cases[0].passed).toBe(false)
    expect(result.cases[0].actual).toBe(-1)
    expect(result.cases[0].error).toBeUndefined()
  })

  it('reports errors from the function', async () => {
    const fn = async () => {
      throw new Error('boom')
    }
    const result = await runCases(
      { code: '', functionName: 'f', cases: [{ args: [], expected: 0 }], language: 'javascript' },
      fn,
    )
    expect(result.cases[0].passed).toBe(false)
    expect(result.cases[0].error).toBe('boom')
  })
})