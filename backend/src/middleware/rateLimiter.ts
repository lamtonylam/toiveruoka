import { rateLimit, type Options } from 'express-rate-limit';

export interface RateLimiterConfig {
  windowMs?: number;
  limit?: number;
  message?: { error: string };
  statusCode?: number;
}

const defaultWindowMs = process.env.RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
  : 5 * 60 * 1000; // 5 minutes

const defaultLimit = process.env.RATE_LIMIT_MAX
  ? parseInt(process.env.RATE_LIMIT_MAX, 10)
  : 100; // 100 requests per window

export const createRateLimiter = (options?: Partial<Options>) => {
  return rateLimit({
    windowMs: defaultWindowMs,
    limit: defaultLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later.',
    },
    statusCode: 429,
    ...options,
  });
};

const rateLimiter = createRateLimiter();

export default rateLimiter;
