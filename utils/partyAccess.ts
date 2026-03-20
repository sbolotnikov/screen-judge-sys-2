import clientPromise from '@/lib/mongodb';

export interface UserPartyAccess {
  id: string;
  email: string;
  name: string;
  role: string;
  parties: string[];
}

export interface PartyWithAccess {
  id: string;
  name: string;
  [key: string]: unknown;
}

export async function getUserAccessibleParties(
  userEmail: string
): Promise<PartyWithAccess[]> {
  try {
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const userDoc = await db.collection('users').findOne({ email: userEmail });

    if (!userDoc) {
      console.log('User not found:', userEmail);
      return [];
    }

    const userRole = userDoc.role || 'User';
    const userParties = userDoc.parties || [];

    const parties = await db.collection('parties').find({}).toArray();
    const allParties = parties.map((doc: { _id: { toString: () => string }; name?: string; [key: string]: unknown }) => ({
      id: doc._id.toString(),
      name: doc.name || 'Unnamed Party',
      ...doc,
    })) as PartyWithAccess[];

    if (userRole === 'Admin') {
      return allParties.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const accessibleParties = allParties.filter((party) =>
      userParties.includes(party.id)
    );

    return accessibleParties.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (error) {
    console.error('Error getting accessible parties:', error);
    return [];
  }
}

export async function addPartyAccessToUser(
  userEmail: string,
  partyId: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const result = await db.collection('users').updateOne(
      { email: userEmail },
      { $addToSet: { parties: partyId } }
    );

    if (result.matchedCount === 0) {
      console.log('User not found:', userEmail);
      return false;
    }

    console.log(`Added party ${partyId} access to user ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error adding party access:', error);
    return false;
  }
}

export async function addPartyAccessToAllUsers(partyId: string): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('screen-handler');
    await db.collection('users').updateMany(
      {},
      { $addToSet: { parties: partyId } }
    );
    console.log(`Added party ${partyId} access to all users`);
  } catch (error) {
    console.error('Error adding party access to all users:', error);
  }
}

export async function hasPartyAccess(
  userEmail: string,
  partyId: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const userDoc = await db.collection('users').findOne({ email: userEmail });

    if (!userDoc) {
      return false;
    }

    const userRole = userDoc.role || 'User';
    const userParties = userDoc.parties || [];

    if (userRole === 'Admin') {
      return true;
    }

    return userParties.includes(partyId);
  } catch (error) {
    console.error('Error checking party access:', error);
    return false;
  }
}
