import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getNeynarApiKey, NEYNAR_API_BASE_URL } from '@/lib/neynar';
import { getDatabase } from '@/lib/mongodb';
import type { NeynarUser } from '@/types/neynar';

export const dynamic = 'force-dynamic';

interface GenerateSignatureBody {
  userAddress: string;
  fid: number;
}

// USDC token address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

interface CachedUser {
  fid: number;
  userData: NeynarUser;
  cachedAt: number;
}

// Helper function to get user data from cache or API
async function getUserData(fid: number): Promise<NeynarUser | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<CachedUser>('counter_users');
    
    // Check if user exists in cache (cache valid for 24 hours)
    const cached = await collection.findOne({ fid });
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cached && (now - cached.cachedAt) < cacheExpiry) {
      console.log('✅ Using cached user data for FID:', fid);
      return cached.userData;
    }
    
    // Fetch from Neynar API
    console.log('📡 Fetching user data from Neynar API for FID:', fid);
    const apiKey = getNeynarApiKey();
    const url = `${NEYNAR_API_BASE_URL}/user/bulk/?fids=${fid}`;
    
    const neynarResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    if (!neynarResponse.ok) {
      console.error('⚠️ Failed to fetch user from Neynar API:', neynarResponse.status);
      return null;
    }
    
    const neynarData = await neynarResponse.json();
    const user: NeynarUser | undefined = neynarData.users?.[0];
    
    if (!user) {
      console.warn('⚠️ User not found in Neynar API for FID:', fid);
      return null;
    }
    
    // Save to cache
    await collection.updateOne(
      { fid },
      {
        $set: {
          fid,
          userData: user,
          cachedAt: now,
        },
      },
      { upsert: true }
    );
    
    console.log('💾 Saved user data to cache for FID:', fid);
    return user;
  } catch (error) {
    console.error('⚠️ Error getting user data:', error);
    return null;
  }
}

// Helper function to verify address is associated with FID
async function verifyAddressForFid(address: string, fid: number): Promise<boolean> {
  try {
    // Get user data from cache or API
    const user = await getUserData(fid);
    
    if (!user) {
      return false;
    }
    
    const addressLower = address.toLowerCase();
    let addressMatches = false;
    
    // Check if address matches custody address
    if (user.custody_address?.toLowerCase() === addressLower) {
      addressMatches = true;
    }

    // Check if address matches primary verified address
    if (!addressMatches && user.verified_addresses?.primary?.eth_address?.toLowerCase() === addressLower) {
      addressMatches = true;
    }

    // Check if address is in verified addresses list
    if (!addressMatches) {
      const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
      const isInVerifiedList = verifiedAddresses.some(
        (addr: string) => addr.toLowerCase() === addressLower
      );
      if (isInVerifiedList) {
        addressMatches = true;
      }
    }

    // Check verifications array (legacy format)
    if (!addressMatches) {
      const verifications = user.verifications || [];
      const isInVerifications = verifications.some(
        (addr: string) => addr.toLowerCase() === addressLower
      );
      if (isInVerifications) {
        addressMatches = true;
      }
    }
    
    if (!addressMatches) {
      const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
      const verifications = user.verifications || [];
      console.error('🚨 Security Alert: Address verification failed', {
        fid,
        providedAddress: address,
        custodyAddress: user.custody_address?.toLowerCase(),
        primaryAddress: user.verified_addresses?.primary?.eth_address?.toLowerCase(),
        verifiedAddresses: verifiedAddresses.map((a: string) => a.toLowerCase()),
        verifications: verifications.map((a: string) => a.toLowerCase())
      });
      return false;
    }
    
    console.log('✅ Address verification passed', {
      fid,
      address: addressLower
    });
    return true;
  } catch (error) {
    console.error('⚠️ Error verifying address with Neynar API:', error);
    return false;
  }
}

// Generate reward amount based on follower count
function generateCounterReward(followerCount: number): number {
  // If user has less than 20 followers, give them 0.0001 USDC
  if (followerCount < 20) {
    console.log('🔥 User has less than 20 followers, giving them 0.0001 USDC', followerCount);
    return 0.0001;
  }
  
  // Otherwise, generate random USDC amount between 0.01 and 0.02
  const amount = 0.001 + (Math.random() * 0.001);
  return parseFloat(amount.toFixed(6));
}

// Convert amount to token units
function convertToTokenUnits(amount: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, fid } = (await request.json()) as GenerateSignatureBody;

    if (!userAddress || !fid) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress or fid' },
        { status: 400 },
      );
    }

    // SECURITY CHECK: Verify that the address is associated with the FID using Neynar API
    const isAddressVerified = await verifyAddressForFid(userAddress, fid);
    if (!isAddressVerified) {
      console.error('❌ Security check failed: Address is not associated with FID', {
        address: userAddress,
        fid: fid
      });
      return NextResponse.json(
        { success: false, error: 'Address verification failed: Address is not associated with this FID' },
        { status: 403 },
      );
    }

    // Get user data to check follower count
    const user = await getUserData(fid);
    const followerCount = user?.follower_count || 0;

    console.log('✅ Security check passed: Address verified for FID', {
      address: userAddress,
      fid: fid,
      followerCount
    });

    // Generate reward amount based on follower count (backend calculates it)
    const rewardAmount = generateCounterReward(followerCount);
    const amountInWei = convertToTokenUnits(rewardAmount);

    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;

    if (!signerPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'SIGNER_PRIVATE_KEY is not configured on the server' },
        { status: 500 },
      );
    }

    const wallet = new ethers.Wallet(signerPrivateKey);

    // Pack data: keccak256(abi.encodePacked(user, token, amount))
    const packedData = ethers.solidityPacked(
      ['address', 'address', 'uint256'],
      [userAddress, USDC_ADDRESS, amountInWei]
    );
    
    const messageHash = ethers.keccak256(packedData);
    
    // Sign the message hash (contract uses toEthSignedMessageHash internally)
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log('Signature data:', {
      userAddress,
      tokenAddress: USDC_ADDRESS,
      amount: rewardAmount,
      amountInWei: amountInWei.toString()
    });

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
      { success: false, error: 'Failed to generate signature' },
      { status: 500 },
    );
  }
}
