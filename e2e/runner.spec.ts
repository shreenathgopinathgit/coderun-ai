import { test, expect } from '@playwright/test'

test('JS runner executes user code and returns results', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { JSTSWRunnerClient } = await import('/src/runner/client.ts')
    const client = new JSTSWRunnerClient()
    const r = await client.run({
      code: 'export function add(a, b) { return a + b }',
      functionName: 'add',
      cases: [{ args: [2, 3], expected: 5 }],
      language: 'javascript',
    })
    client.dispose()
    return r
  })
  expect(result.cases[0].passed).toBe(true)
  expect(result.cases[0].actual).toBe(5)
})

test('TypeScript runner transpiles and runs', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { JSTSWRunnerClient } = await import('/src/runner/client.ts')
    const client = new JSTSWRunnerClient()
    const r = await client.run({
      code: 'export function add(a: number, b: number): number { return a + b }',
      functionName: 'add',
      cases: [{ args: [1, 2], expected: 3 }],
      language: 'typescript',
    })
    client.dispose()
    return r
  })
  expect(result.cases[0].passed).toBe(true)
})

test('runner captures console.log output', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { JSTSWRunnerClient } = await import('/src/runner/client.ts')
    const client = new JSTSWRunnerClient()
    const r = await client.run({
      code: 'export function greet(name) { console.log("hello " + name); return name }',
      functionName: 'greet',
      cases: [{ args: ['world'], expected: 'world' }],
      language: 'javascript',
    })
    client.dispose()
    return r
  })
  expect(result.consoleOutput).toContain('hello world')
})

test('infinite loop is terminated with Time Limit Exceeded', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { JSTSWRunnerClient } = await import('/src/runner/client.ts')
    const client = new JSTSWRunnerClient()
    try {
      await client.run({
        code: 'export function loop() { while(true) {} }',
        functionName: 'loop',
        cases: [{ args: [], expected: null }],
        language: 'javascript',
        timeoutMs: 500,
      })
      return { threw: false }
    } catch (e) {
      return { threw: true, message: e instanceof Error ? e.message : String(e) }
    } finally {
      client.dispose()
    }
  })
  expect(result.threw).toBe(true)
  expect(result.message).toBe('Time Limit Exceeded')
})

test('Python runner executes user code via Pyodide', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { PyodideRunnerClient } = await import('/src/runner/pyClient.ts')
    const client = new PyodideRunnerClient()
    const r = await client.run({
      code: 'def add(a, b):\n    return a + b',
      functionName: 'add',
      cases: [{ args: [2, 3], expected: 5 }, { args: [-1, 1], expected: 0 }],
      language: 'python',
      timeoutMs: 5000,
    })
    client.dispose()
    return r
  })
  expect(result.cases[0].passed).toBe(true)
  expect(result.cases[0].actual).toBe(5)
  expect(result.cases[1].passed).toBe(true)
  expect(result.cases[1].actual).toBe(0)
}, 60000)

test('Python runner captures print output', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { PyodideRunnerClient } = await import('/src/runner/pyClient.ts')
    const client = new PyodideRunnerClient()
    const r = await client.run({
      code: 'def greet(name):\n    print("hello " + name)\n    return name',
      functionName: 'greet',
      cases: [{ args: ['world'], expected: 'world' }],
      language: 'python',
      timeoutMs: 5000,
    })
    client.dispose()
    return r
  })
  expect(result.consoleOutput).toContain('hello world')
  expect(result.cases[0].passed).toBe(true)
}, 60000)

test('hidden cases expose only pass/fail', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { JSTSWRunnerClient } = await import('/src/runner/client.ts')
    const client = new JSTSWRunnerClient()
    const r = await client.run({
      code: 'export function f(x) { return x * 2 }',
      functionName: 'f',
      cases: [
        { args: [1], expected: 2, hidden: false },
        { args: [5], expected: 10, hidden: true },
      ],
      language: 'javascript',
    })
    client.dispose()
    return r
  })
  expect(result.cases[0].passed).toBe(true)
  expect(result.cases[0].actual).toBe(2)
  expect(result.cases[1].passed).toBe(true)
  expect(result.cases[1].actual).toBeUndefined()
})