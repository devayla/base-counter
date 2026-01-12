import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { invalidateLeaderboardCache } from '@/lib/kv';

export const dynamic = 'force-dynamic';

interface UpdateLeaderboardBody {
  fid: number;
  username: string;
  imageUrl: string;
  userAddress: string;
  totalIncrements: number;
  totalRewards: number;
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  imageUrl: string;
  userAddress: string;
  totalIncrements: number;
  totalRewards: number;
  updatedAt: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateLeaderboardBody;

    if (!body.fid || !body.username || !body.userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeaderboardEntry>('counter_leaderboard');

    // Update or insert leaderboard entry
    await collection.updateOne(
      { fid: body.fid },
      {
        $set: {
          fid: body.fid,
          username: body.username,
          imageUrl: body.imageUrl || '',
          userAddress: body.userAddress.toLowerCase(),
          totalIncrements: body.totalIncrements,
          totalRewards: body.totalRewards || 0,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    );

    // Invalidate the leaderboard cache so the next request gets fresh data
    await invalidateLeaderboardCache();

    console.log('✅ Leaderboard updated and cache invalidated for FID:', body.fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}
