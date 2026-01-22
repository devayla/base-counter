import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { z } from 'zod';
import { getUserData, verifyAddressForFid } from '@/lib/neynar';

export const dynamic = 'force-dynamic';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

// Input validation schema
const requestSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  fid: z.number().positive(),
});

/**
 * Generate reward amount based on follower count
 */
function generateCounterReward(followerCount: number): number {
  if (followerCount < 20) {
    return 0.0001;
  }
  const amount = 0.001 + (Math.random() * 0.001);
  return parseFloat(amount.toFixed(6));
}

/**
 * Convert amount to token units
 */
function convertToTokenUnits(amount: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { userAddress, fid } = result.data;

    // SECURITY CHECK: Verify that the address is associated with the FID
    const isAddressVerified = await verifyAddressForFid(userAddress, fid);
    if (!isAddressVerified) {
      console.error('❌ Security check failed: Address is not associated with FID', { userAddress, fid });
      return NextResponse.json(
        { success: false, error: 'Address verification failed: Address is not associated with this FID' },
        { status: 403 },
      );
    }

    // Get user data for reward calculation
    const user = await getUserData(fid);
    const followerCount = user?.follower_count || 0;

    const rewardAmount = generateCounterReward(followerCount);
    const amountInWei = convertToTokenUnits(rewardAmount);

    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!signerPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'Signer configuration error' },
        { status: 500 },
      );
    }

    const wallet = new ethers.Wallet(signerPrivateKey);
    const packedData = ethers.solidityPacked(
      ['address', 'address', 'uint256'],
      [userAddress, USDC_ADDRESS, amountInWei]
    );

    const messageHash = ethers.keccak256(packedData);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log('✅ Signature generated successfully', { userAddress, fid, rewardAmount });

    return NextResponse.json({
      success: true,
      signature,
      tokenAddress: USDC_ADDRESS,
      amount: rewardAmount,
      amountInWei: amountInWei.toString(),
    });
  } catch (error) {
    console.error('Error generating counter signature:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
