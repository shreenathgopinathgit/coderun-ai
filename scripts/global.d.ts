declare module '*/scripts/mock-openai.mjs' {
  export function startMock(
    mode?: string,
    opts?: { retryAfter?: number },
  ): Promise<{
    address(): { port: number }
    close(): void
  }>
}
