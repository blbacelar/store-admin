import { RateLimiterMemory } from "rate-limiter-flexible";

// 5 failed attempts per IP per 15-minute window
const loginRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 15 * 60, // 15 minutes in seconds
});

export async function checkLoginRateLimit(ip: string): Promise<void> {
    await loginRateLimiter.consume(ip);
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
    await loginRateLimiter.delete(ip);
}
