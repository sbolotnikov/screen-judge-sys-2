import { NextResponse } from 'next/server';
import { migrateUsersAddPartiesField } from '@/utils/migrationHelpers';

// POST: Run migration to add parties field to existing users
export async function POST() {
  try {
    console.log('Starting migration API call...');
    const result = await migrateUsersAddPartiesField();

    if (result.success) {
      return NextResponse.json({
        message: 'Migration completed successfully',
        usersUpdated: result.usersUpdated,
        partiesGranted: result.partiesGranted,
      });
    } else {
      return NextResponse.json(
        {
          error: `Migration failed: ${result.error}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during migration',
      },
      { status: 500 }
    );
  }
}
