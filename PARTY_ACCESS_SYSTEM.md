# Party Access Control System

This document explains the new party access control system implemented in your screen-handler-app.

## Overview

The system now includes role-based access control for parties:

- **Admin users**: Can see and access ALL parties regardless of permissions
- **Regular users**: Can only see parties they have been granted access to
- **New parties**: Automatically grant access to all existing users when created

## Database Changes

### User Document Structure

Users now have a new field:

```typescript
{
  email: string;
  name: string;
  role: string; // 'Admin' or 'User'
  parties: string[]; // Array of party IDs user has access to
  // ... other existing fields
}
```

## Implementation Details

### 1. Authentication Updates (`lib/configs/authOptions.ts`)

- Extended user types to include `parties` field
- Updated session and JWT callbacks to include party access
- New users automatically get empty `parties` array

### 2. Party Access Utilities (`utils/partyAccess.ts`)

Core functions for managing party access:

- `getUserAccessibleParties(userEmail)` - Get parties user can access
- `addPartyAccessToUser(userEmail, partyId)` - Grant access to specific party
- `addPartyAccessToAllUsers(partyId)` - Grant access to all users (for new parties)
- `hasPartyAccess(userEmail, partyId)` - Check if user has access

### 3. Updated Components

#### ChoosePartyModal (`components/ChoosePartyModal.tsx`)

- Now filters parties based on user access
- Automatically grants access to all users when creating new parties
- Uses session-based filtering for party list

#### PartyAccessManager (`components/PartyAccessManager.tsx`)

- Admin-only component for managing user party access
- Allows granting/removing access to specific parties
- Shows current user permissions

### 4. API Endpoints

#### `/api/party-access`

- `GET`: Get user's accessible parties or check specific access
- `POST`: Grant party access (Admin only)
- `DELETE`: Remove party access (Admin only)

#### `/api/users`

- `GET`: Get all users (Admin only)

#### `/api/migrate-users`

- `POST`: One-time migration to add parties field to existing users

## Migration Guide

### For Existing Applications

1. **Run the migration** to add `parties` field to existing users:

   ```bash
   # Call the migration endpoint
   curl -X POST http://localhost:3000/api/migrate-users
   ```

2. **Verify migration**: Check that all users now have a `parties` array with access to all existing parties.

### For New Installations

No migration needed - new users automatically get the `parties` field.

## Usage Examples

### Admin Dashboard Integration

```typescript
import PartyAccessManager from '@/components/PartyAccessManager';

// In your admin dashboard component
function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <PartyAccessManager />
    </div>
  );
}
```

### Checking User Access in Components

```typescript
import { useSession } from 'next-auth/react';
import { getUserAccessibleParties } from '@/utils/partyAccess';

function MyComponent() {
  const { data: session } = useSession();
  const [userParties, setUserParties] = useState([]);

  useEffect(() => {
    if (session?.user?.email) {
      getUserAccessibleParties(session.user.email).then(setUserParties);
    }
  }, [session]);

  // Component logic...
}
```

### Programmatically Managing Access

```typescript
import {
  addPartyAccessToUser,
  addPartyAccessToAllUsers,
} from '@/utils/partyAccess';

// Grant access to specific user
await addPartyAccessToUser('user@example.com', 'party123');

// Grant access to all users (when creating new party)
await addPartyAccessToAllUsers('newParty456');
```

## Security Features

1. **Role-based access**: Only admins can modify party permissions
2. **Session validation**: All access checks verify user session
3. **Automatic access**: New parties grant access to all users by default
4. **Admin override**: Admins always see all parties regardless of permissions

## Development Notes

### TypeScript Extensions

Extended NextAuth types to include party information:

```typescript
// types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      // ... existing fields
      parties?: string[];
    };
  }
}
```

### Testing Access Control

1. Create test users with different roles
2. Create test parties
3. Verify regular users only see assigned parties
4. Verify admins see all parties
5. Test the PartyAccessManager component

## Troubleshooting

### Common Issues

1. **Users can't see any parties**: Run migration to grant access to existing parties
2. **TypeScript errors**: Ensure `types/next-auth.d.ts` is properly configured
3. **Session not updating**: Clear browser storage and re-login

### Debug Logging

The system includes console logging for debugging:

- Party access checks
- User authentication
- Database operations

Check browser console and server logs for detailed information.

## Future Enhancements

Potential improvements to consider:

1. **Party creation permissions**: Control who can create parties
2. **Group-based access**: Organize users into groups with shared permissions
3. **Time-based access**: Temporary party access with expiration
4. **Audit logging**: Track all party access changes
5. **Bulk user management**: Import/export user permissions
