import { describe, it, expect } from 'vitest'
import { PyodideRunnerClient } from './pyClient'
import { runners, runLanguage, NO_EXECUTOR } from './executors'

describe('executor stubs', () => {
  const stubLanguages = ['java', 'c', 'cpp', 'go', 'rust']

  it('returns an honest not-configured message for each stub language', async () => {
    for (const lang of stubLanguages) {
      const result = await runners[lang].run({
        code: '',
        functionName: 'f',
        cases: [{ args: [], expected: null }],
        language: 'javascript',
      })
      expect(result.cases).toHaveLength(0)
      expect(result.consoleOutput).toEqual([NO_EXECUTOR])
    }
  })

  it('runLanguage rejects unknown languages', async () => {
    await expect(runLanguage('cobol', { code: '', functionName: 'f', cases: [], language: 'javascript' })).rejects.toThrow()
  })
})

describe('PyodideRunnerClient state', () => {
  it('starts not loading with no load error', () => {
    const client = new PyodideRunnerClient()
    expect(client.isLoading).toBe(false)
    expect(client.lastLoadError).toBeNull()
    client.dispose()
  })
})