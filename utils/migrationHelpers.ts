/**
 * Migration script to add parties field to existing users
 * This should be run once to migrate existing data
 */

import clientPromise from '@/lib/mongodb';

export async function migrateUsersAddPartiesField() {
  try {
    console.log('Starting user migration to add parties field...');

    const client = await clientPromise;
    const db = client.db('screen-handler');

    // Get all users
    const users = await db.collection('users').find({}).toArray();

    // Get all party IDs
    const parties = await db.collection('parties').find({}).toArray();
    const allPartyIds = parties.map((doc) => doc._id.toString());

    console.log(
      `Found ${users.length} users and ${allPartyIds.length} parties`
    );

    // Update each user to have all party access
    const updatePromises = users.map(async (userDoc) => {
      // Skip if user already has parties field
      if (userDoc.parties && Array.isArray(userDoc.parties)) {
        console.log(`User ${userDoc.email} already has parties field`);
        return;
      }

      await db.collection('users').updateOne(
        { _id: userDoc._id },
        { $set: { parties: allPartyIds } }
      );

      console.log(
        `Updated user ${userDoc.email} with ${allPartyIds.length} party access`
      );
    });

    await Promise.all(updatePromises);
    console.log('Migration completed successfully!');

    return {
      success: true,
      usersUpdated: users.length,
      partiesGranted: allPartyIds.length,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function addPartiesToSpecificUser(
  userEmail: string,
  partyIds: string[]
) {
  try {
    const client = await clientPromise;
    const db = client.db('screen-handler');

    const userDoc = await db.collection('users').findOne({ email: userEmail });

    if (!userDoc) {
      throw new Error(`User ${userEmail} not found`);
    }

    const currentParties = userDoc.parties || [];

    // Merge new party IDs with existing ones (no duplicates)
    const updatedParties = [...new Set([...currentParties, ...partyIds])];

    await db.collection('users').updateOne(
      { _id: userDoc._id },
      { $set: { parties: updatedParties } }
    );

    console.log(`Added ${partyIds.length} parties to user ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding parties to user:', error);
    throw error;
  }
}
