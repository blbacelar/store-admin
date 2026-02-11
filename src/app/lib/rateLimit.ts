/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { NextResponse } from 'next/server';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

interface RateLimitStore {
    [key: string]: RateLimitRecord;
}

const store: RateLimitStore = {};

/**
 * Rate limit a request based on an identifier
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with limited flag and optional response
 */
export function rateLimit(
    identifier: string,
    limit: number = 10,
    windowMs: number = 60000
): { limited: boolean; response?: NextResponse } {
    const now = Date.now();
    const record = store[identifier];

    // If no record exists or the window has expired, create a new one
    if (!record || now > record.resetTime) {
        store[identifier] = { count: 1, resetTime: now + windowMs };
        return { limited: false };
    }

    // If limit is exceeded, return rate limit response
    if (record.count >= limit) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return {
            limited: true,
            response: NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(limit),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
                    },
                }
            ),
        };
    }

    // Increment the counter
    record.count++;
    return { limited: false };
}

/**
 * Clean up expired rate limit records periodically
 * Call this on a schedule or during startup
 */
export function cleanupRateLimitStore() {
    const now = Date.now();
    for (const key in store) {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    }
}

// Clean up every 5 minutes
if (typeof window === 'undefined') {
    setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
