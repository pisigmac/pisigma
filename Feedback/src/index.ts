import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, FeedbackItem, FeedbackSummary, SubmitFeedbackRequest, SubmitFeedbackResponse } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const feedbackStore: FeedbackItem[] = [
  {
    id: 'fb_init_1',
    user_id: 'usr_sample_1',
    category: 'general',
    rating: 5,
    comment: 'Great infrastructure services!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fb_init_2',
    user_id: 'usr_sample_2',
    category: 'ui',
    rating: 4,
    comment: 'Clean API endpoints.',
    created_at: new Date().toISOString(),
  },
]

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-feedback',
    environment: c.env?.FEEDBACK_ENV || 'development',
  })
})

app.post('/v1/feedback/submit', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<SubmitFeedbackRequest>

  if (!body.comment || typeof body.comment !== 'string' || body.comment.trim() === '') {
    return c.json({ error: 'Missing or invalid required field: comment' }, 400)
  }

  if (typeof body.rating === 'number' && (body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating))) {
    return c.json({ error: 'Rating must be an integer between 1 and 5' }, 400)
  }

  const feedbackItem: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user_id: body.user_id?.trim(),
    category: body.category?.trim() || 'general',
    rating: body.rating,
    comment: body.comment.trim(),
    metadata: body.metadata,
    created_at: new Date().toISOString(),
  }

  feedbackStore.push(feedbackItem)

  const response: SubmitFeedbackResponse = {
    success: true,
    feedback: feedbackItem,
  }

  return c.json(response, 201)
})

app.get('/v1/feedback/summary', (c) => {
  const categoryFilter = c.req.query('category')?.trim()

  const items = categoryFilter ? feedbackStore.filter((item) => item.category === categoryFilter) : feedbackStore

  const totalCount = items.length
  let totalRatingSum = 0
  let ratedCount = 0
  const categoryCounts: Record<string, number> = {}
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (const item of items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    if (typeof item.rating === 'number' && item.rating >= 1 && item.rating <= 5) {
      totalRatingSum += item.rating
      ratedCount++
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1
    }
  }

  const averageRating = ratedCount > 0 ? Math.round((totalRatingSum / ratedCount) * 100) / 100 : 0

  const summary: FeedbackSummary = {
    total_count: totalCount,
    average_rating: averageRating,
    category_counts: categoryCounts,
    rating_distribution: ratingDistribution,
  }

  return c.json(summary)
})

app.get('/v1/feedback/items', (c) => {
  const categoryFilter = c.req.query('category')?.trim()
  const items = categoryFilter ? feedbackStore.filter((item) => item.category === categoryFilter) : feedbackStore
  return c.json({ items })
})

export default app
