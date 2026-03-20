import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface SessionWithUser {
  user?: {
    email?: string | null;
    role?: string | null;
  };
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');
    const userEmail = session.user.email;

    const currentUser = await db.collection('users').findOne({ email: userEmail });

    if (!currentUser || currentUser.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await db.collection('users').find({}).toArray();
    const allUsers = users.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
    }));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');
    const userEmail = session.user.email;
    const currentUser = await db.collection('users').findOne({ email: userEmail });

    if (!currentUser || currentUser.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, role, name, image } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const dataToUpdate: { role?: string; name?: string; image?: string } = {};
    if (role) dataToUpdate.role = role;
    if (name) dataToUpdate.name = name;
    if (image) dataToUpdate.image = image;

    let query: Record<string, unknown> = { _id: userId };
    if (ObjectId.isValid(userId)) {
      query = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }] };
    }

    await db.collection('users').updateOne(query, { $set: dataToUpdate });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error in users PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
