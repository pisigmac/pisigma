import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, TestRunRequest, TestRunResult, BenchmarkRequest, BenchmarkResult } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-api-tester',
    environment: c.env?.APITESTER_ENV || 'development',
  })
})

app.post('/v1/tester/run', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<TestRunRequest>

  if (!body.url || typeof body.url !== 'string' || body.url.trim() === '') {
    return c.json({ error: 'URL is required' }, 400)
  }

  const targetUrl = body.url.trim()
  const method = (body.method || 'GET').toUpperCase()
  const expectedStatus = body.expected_status || 200
  const startTime = Date.now()

  try {
    const fetchHeaders = new Headers(body.headers || {})
    const fetchBody = body.body ? (typeof body.body === 'string' ? body.body : JSON.stringify(body.body)) : undefined

    const response = await fetch(targetUrl, {
      method,
      headers: fetchHeaders,
      body: fetchBody,
    })

    const responseTime = Date.now() - startTime
    let responseBody: unknown
    try {
      responseBody = await response.json()
    } catch {
      responseBody = await response.text().catch(() => '')
    }

    const matchedExpectedStatus = response.status === expectedStatus
    const result: TestRunResult = {
      success: matchedExpectedStatus,
      url: targetUrl,
      method,
      status_code: response.status,
      response_time_ms: responseTime,
      body: responseBody,
      matched_expected_status: matchedExpectedStatus,
      timestamp: new Date().toISOString(),
    }

    return c.json(result)
  } catch (err: unknown) {
    const responseTime = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : String(err)

    const result: TestRunResult = {
      success: false,
      url: targetUrl,
      method,
      status_code: 0,
      response_time_ms: responseTime,
      matched_expected_status: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }

    return c.json(result)
  }
})

app.post('/v1/tester/benchmark', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<BenchmarkRequest>

  if (!body.url || typeof body.url !== 'string' || body.url.trim() === '') {
    return c.json({ error: 'URL is required' }, 400)
  }

  const targetUrl = body.url.trim()
  const method = (body.method || 'GET').toUpperCase()
  let iterations = body.iterations || 10
  if (isNaN(iterations) || iterations < 1) iterations = 10
  if (iterations > 100) iterations = 100

  const expectedStatus = body.expected_status || 200
  const responseTimes: number[] = []
  let successfulRequests = 0
  let failedRequests = 0

  const benchmarkStart = Date.now()

  for (let i = 0; i < iterations; i++) {
    const reqStart = Date.now()
    try {
      const fetchHeaders = new Headers(body.headers || {})
      const fetchBody = body.body ? (typeof body.body === 'string' ? body.body : JSON.stringify(body.body)) : undefined

      const response = await fetch(targetUrl, {
        method,
        headers: fetchHeaders,
        body: fetchBody,
      })

      const duration = Date.now() - reqStart
      responseTimes.push(duration)

      if (response.status === expectedStatus || response.ok) {
        successfulRequests++
      } else {
        failedRequests++
      }
    } catch {
      const duration = Date.now() - reqStart
      responseTimes.push(duration)
      failedRequests++
    }
  }

  const totalDuration = Date.now() - benchmarkStart
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  const sumResponseTime = responseTimes.reduce((a, b) => a + b, 0)
  const avgResponseTime = responseTimes.length > 0 ? Math.round((sumResponseTime / responseTimes.length) * 100) / 100 : 0
  const requestsPerSecond = totalDuration > 0 ? Math.round((iterations / (totalDuration / 1000)) * 100) / 100 : 0

  const result: BenchmarkResult = {
    url: targetUrl,
    method,
    total_requests: iterations,
    successful_requests: successfulRequests,
    failed_requests: failedRequests,
    avg_response_time_ms: avgResponseTime,
    min_response_time_ms: minResponseTime,
    max_response_time_ms: maxResponseTime,
    requests_per_second: requestsPerSecond,
    timestamp: new Date().toISOString(),
  }

  return c.json(result)
})

export default app
