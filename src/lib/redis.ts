import { Redis } from "@upstash/redis";

// Initialize Redis client using environment variables
// Defaults to REST structure common in Vercel/Upstash integration
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export { redis };
