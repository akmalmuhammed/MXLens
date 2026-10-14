import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedis(): Redis {
    if (redisClient) {
        return redisClient;
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error("Upstash Redis credentials missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
    }

    redisClient = new Redis({ url, token });
    return redisClient;
}

export const redis = new Proxy({} as Redis, {
    get(_target, property, receiver) {
        const client = getRedis();
        const value = Reflect.get(client, property, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});
