import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/mongodb';
import { getCachedLeaderboard, setCachedLeaderboard } from '@/lib/kv';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  cache: z.enum(['true', 'false']).optional().default('true'),
});

interface LeaderboardEntry {
  fid: number;
  username: string;
  imageUrl: string;
  userAddress: string;
  totalIncrements: number;
  totalRewards: number;
  updatedAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { limit, cache } = parsed.data;
    const useCache = cache === 'true';

    // Try to get from cache first if default limit
    if (useCache && limit === 100) {
      const cachedData = await getCachedLeaderboard();
      if (cachedData) {
        console.log('🚀 Serving leaderboard from Redis cache');
        return NextResponse.json({
          success: true,
          leaderboard: cachedData,
          cached: true
        });
      }
    }

    const db = await getDatabase();
    const collection = db.collection<LeaderboardEntry>('counter_leaderboard');

    // Get top users sorted by total increments
    const leaderboard = await collection
      .find({})
      .sort({ totalIncrements: -1 })
      .limit(limit)
      .project({
        fid: 1,
        username: 1,
        imageUrl: 1,
        userAddress: 1,
        totalIncrements: 1,
        totalRewards: 1,
      })
      .toArray();

    const formattedLeaderboard = leaderboard.map((entry: LeaderboardEntry) => ({
      fid: entry.fid,
      username: entry.username,
      imageUrl: entry.imageUrl,
      userAddress: entry.userAddress,
      totalIncrements: entry.totalIncrements,
      totalRewards: entry.totalRewards,
    }));

    // Cache the result if default limit
    if (limit === 100) {
      await setCachedLeaderboard(formattedLeaderboard);
      console.log('💾 Leaderboard cached to Redis');
    }

    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
