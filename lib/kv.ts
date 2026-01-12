import { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  return await redis.get<MiniAppNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
}

// Leaderboard Caching
const LEADERBOARD_CACHE_KEY = 'leaderboard_top_100';

export async function getCachedLeaderboard(): Promise<any[] | null> {
  return await redis.get<any[]>(LEADERBOARD_CACHE_KEY);
}

export async function setCachedLeaderboard(data: any[]): Promise<void> {
  // Cache for 5 minutes
  await redis.set(LEADERBOARD_CACHE_KEY, data, { ex: 300 });
}

export async function invalidateLeaderboardCache(): Promise<void> {
  await redis.del(LEADERBOARD_CACHE_KEY);
}