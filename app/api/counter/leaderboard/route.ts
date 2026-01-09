import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

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

    const db = await getDatabase();
    const collection = db.collection<LeaderboardEntry>('counter_leaderboard');

    // Get top users sorted by total increments (descending)
    const leaderboard = await collection
      .find({})
      .sort({ totalIncrements: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard.map((entry) => ({
        fid: entry.fid,
        username: entry.username,
        imageUrl: entry.imageUrl,
        userAddress: entry.userAddress,
        totalIncrements: entry.totalIncrements,
        totalRewards: entry.totalRewards,
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
