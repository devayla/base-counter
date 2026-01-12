import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getCachedLeaderboard, setCachedLeaderboard } from '@/lib/kv';

export const dynamic = 'force-dynamic';

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
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const useCache = searchParams.get('cache') !== 'false';

    // Try to get from cache first if limit is 100 (default)
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

    // Get top users sorted by total increments (descending)
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

    const formattedLeaderboard = leaderboard.map((entry) => ({
      fid: entry.fid,
      username: entry.username,
      imageUrl: entry.imageUrl,
      userAddress: entry.userAddress,
      totalIncrements: entry.totalIncrements,
      totalRewards: entry.totalRewards,
    }));

    // Cache the result if it's the default limit
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
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
