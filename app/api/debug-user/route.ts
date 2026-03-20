import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');

    const userDoc = await db.collection('users').findOne({ email });

    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = {
      id: userDoc._id.toString(),
      ...userDoc,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
