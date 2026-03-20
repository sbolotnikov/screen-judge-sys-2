import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';
import {
  addPartyAccessToUser,
  getUserAccessibleParties,
  hasPartyAccess,
} from '@/utils/partyAccess';
import clientPromise from '@/lib/mongodb';

interface SessionWithUser {
  user?: {
    email?: string | null;
    role?: string | null;
  };
}

export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const userEmail = searchParams.get('userEmail') || session.user.email;
    const getAllParties = searchParams.get('getAllParties') === 'true';

    if (getAllParties && session.user.role === 'Admin') {
      const client = await clientPromise;
      const db = client.db('screen-handler');
      const parties = await db.collection('parties').find({}).toArray();
      const allParties = parties.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name || 'Unnamed Party',
        ...doc,
      }));
      return NextResponse.json({ parties: allParties });
    }

    if (partyId) {
      const access = await hasPartyAccess(userEmail, partyId);
      return NextResponse.json({ hasAccess: access });
    } else {
      const parties = await getUserAccessibleParties(userEmail);
      return NextResponse.json({ parties });
    }
  } catch (error) {
    console.error('Error in party access GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userEmail, partyId, addAllUsers } = await req.json();

    if (!partyId) {
      return NextResponse.json(
        { error: 'Missing partyId' },
        { status: 400 }
      );
    }

    if (addAllUsers) {
      const client = await clientPromise;
      const db = client.db('screen-handler');
      await db.collection('users').updateMany(
        {},
        { $addToSet: { parties: partyId } }
      );
      return NextResponse.json({
        message: 'Party access granted to all users successfully',
      });
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Missing userEmail' },
        { status: 400 }
      );
    }

    const success = await addPartyAccessToUser(userEmail, partyId);

    if (success) {
      return NextResponse.json({
        message: 'Party access granted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to grant party access' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in party access POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userEmail, partyId } = await req.json();

    if (!userEmail || !partyId) {
      return NextResponse.json(
        { error: 'Missing userEmail or partyId' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');
    const result = await db.collection('users').updateOne(
      { email: userEmail },
      { $pull: { parties: partyId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Party access removed successfully' });
  } catch (error) {
    console.error('Error in party access DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
