import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { UserProfile, callInterview, MockInterview } from '@/utils/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('Testing recommendations API for userId:', userId);

    // Get user profile
    try {
      const userProfiles = await db.select().from(UserProfile).where(eq(UserProfile.userId, userId));
      console.log('User profiles found:', userProfiles.length);
    } catch (dbError) {
      console.error('Error querying UserProfile:', dbError.message);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    // Get call interviews
    try {
      const callInterviews = await db.select().from(callInterview);
      console.log('Call interviews found:', callInterviews.length);
    } catch (dbError) {
      console.error('Error querying callInterview:', dbError.message);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    // Get mock interviews
    try {
      const mockInterviews = await db.select().from(MockInterview).where(eq(MockInterview.isHidden, false));
      console.log('Mock interviews found:', mockInterviews.length);
    } catch (dbError) {
      console.error('Error querying MockInterview:', dbError.message);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database queries successful'
    });

  } catch (error) {
    console.error('Error in test recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
