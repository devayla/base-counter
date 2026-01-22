import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/mongodb';
import { invalidateLeaderboardCache } from '@/lib/kv';
import { verifyAddressForFid } from '@/lib/neynar';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  fid: z.number().positive(),
  username: z.string().min(1),
  imageUrl: z.string().optional().default(''),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  totalIncrements: z.number().nonnegative(),
  totalRewards: z.number().nonnegative().optional().default(0),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fid, username, imageUrl, userAddress, totalIncrements, totalRewards } = result.data;

    // SECURITY CHECK: Verify that the address is associated with the FID
    const isAddressVerified = await verifyAddressForFid(userAddress, fid);
    if (!isAddressVerified) {
      console.error('❌ Security check failed in update-leaderboard: Address not associated with FID', { userAddress, fid });
      return NextResponse.json(
        { success: false, error: 'Authorization failed: Address not associated with FID' },
        { status: 403 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeaderboardEntry>('counter_leaderboard');

    // Update or insert leaderboard entry
    await collection.updateOne(
      { fid },
      {
        $set: {
          fid,
          username,
          imageUrl,
          userAddress: userAddress.toLowerCase(),
          totalIncrements,
          totalRewards,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    );

    // Invalidate the leaderboard cache
    await invalidateLeaderboardCache();

    console.log('✅ Leaderboard updated successfully for FID:', fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
