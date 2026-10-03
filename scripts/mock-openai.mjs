import http from 'node:http'

/**
 * Tiny OpenAI-compatible mock server for tests and verification only.
 * It is not shipped in the app. Usage:
 *
 *   import { startMock } from './scripts/mock-openai.mjs'
 *   const server = await startMock('stream')
 *   const base = `http://localhost:${server.address().port}`
 *   // ... run tests ...
 *   server.close()
 *
 * Modes:
 *   stream     - normal streaming response (text/event-stream)
 *   401        - rejects every request with an auth error
 *   429        - rate-limits the first request, then streams normally
 *   nostream   - answers with a plain JSON body (no text/event-stream),
 *                forcing the client to fall back to non-streaming
 */

export function startMock(mode = 'stream', opts = {}) {
  return new Promise((resolve) => {
    let rateLimited = true
    const retryAfter = opts.retryAfter ?? 1

    function sseChunk(text) {
      return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
    }

    function streamResponse(res) {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache',
      })
      const words = ['Hello', ' from', ' the', ' mock', ' server.']
      let i = 0
      const send = () => {
        if (i >= words.length) {
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }
        res.write(sseChunk(words[i]))
        i++
        setTimeout(send, 10)
      }
      send()
    }

    function json(res, body, status = 200) {
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(body))
    }

    function handleChat(res, streaming = true) {
      if (mode === '401') {
        json(res, { error: { message: 'Invalid API key', type: 'invalid_request_error' } }, 401)
        return
      }
      if (mode === '429') {
        if (rateLimited) {
          rateLimited = false
          res.writeHead(429, { 'content-type': 'application/json', 'retry-after': '1' })
          res.end(JSON.stringify({ error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } }))
          return
        }
        streamResponse(res)
        return
      }
      if (mode === 'nostream' || !streaming) {
        json(res, { choices: [{ message: { content: 'plain json reply' } }] })
        return
      }
      streamResponse(res)
    }

    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }
      if (req.method === 'GET' && req.url?.startsWith('/models')) {
        json(res, { data: [{ id: 'mock-stream' }, { id: 'mock-chat' }] })
        return
      }
      if (req.method === 'POST' && req.url?.startsWith('/chat/completions')) {
        let body = ''
        req.on('data', (c) => {
          body += c.toString()
        })
        req.on('end', () => {
          let streaming = true
          try {
            streaming = JSON.parse(body || '{}').stream !== false
          } catch {
            /* keep streaming */
          }
          handleChat(res, streaming)
        })
        return
      }
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: 'not found' } }))
    })

    server.listen(0, () => resolve(server))
  })
}