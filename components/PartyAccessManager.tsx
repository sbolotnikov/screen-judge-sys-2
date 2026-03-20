'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  parties: string[];
}

interface Party {
  id: string;
  name: string;
}

interface SessionWithRole {
  user?: {
    email?: string | null;
    role?: string | null;
  };
}

const PartyAccessManager = () => {
  const { data: session } = useSession() as { data: SessionWithRole | null };
  const [users, setUsers] = useState<User[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (session?.user?.role === 'Admin') {
      fetchUsers();
      fetchParties();
    }
  }, [session]);

  // Only show this component to admins
  if (!session?.user || session.user.role !== 'Admin') {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Admin access required to manage party permissions.</p>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await fetch('/api/party-access?getAllParties=true');
      if (response.ok) {
        const data = await response.json();
        setParties(data.parties || []);
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const grantAccess = async () => {
    if (!selectedUser || !selectedParty) {
      setMessage('Please select both a user and a party');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/party-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: selectedUser,
          partyId: selectedParty,
        }),
      });

      if (response.ok) {
        setMessage('Party access granted successfully!');
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error granting access');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeAccess = async () => {
    if (!selectedUser || !selectedParty) {
      setMessage('Please select both a user and a party');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/party-access', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: selectedUser,
          partyId: selectedParty,
        }),
      });

      if (response.ok) {
        setMessage('Party access removed successfully!');
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error removing access');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find((u) => u.email === selectedUser);

  return (
    <div className="w-full p-4 text-lightMainColor dark:text-darkMainColor">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Party Access Management
      </h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded border ${
            message.includes('Error')
              ? 'bg-red-100/20 border-red-400 text-red-300'
              : 'bg-green-100/20 border-green-400 text-green-300'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select User:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border border-lightMainColor dark:border-darkMainColor rounded-md bg-lightMainBG dark:bg-darkMainBG text-lightMainColor dark:text-darkMainColor focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.email}>
                {user.email} ({user.name || 'No name'}) - {user.role}
              </option>
            ))}
          </select>
        </div>

        {/* Party Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Party:
          </label>
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="w-full p-2 border border-lightMainColor dark:border-darkMainColor rounded-md bg-lightMainBG dark:bg-darkMainBG text-lightMainColor dark:text-darkMainColor focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a party...</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={grantAccess}
          disabled={loading || !selectedUser || !selectedParty}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Grant Access'}
        </button>

        <button
          onClick={removeAccess}
          disabled={loading || !selectedUser || !selectedParty}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Remove Access'}
        </button>
      </div>

      {/* Current User Parties Display */}
      {selectedUserData && (
        <div className="p-4 border border-lightMainColor dark:border-darkMainColor rounded-md bg-lightMainBG/30 dark:bg-darkMainBG/30">
          <h3 className="text-lg font-medium mb-2">
            Current Party Access for {selectedUserData.email}:
          </h3>
          {selectedUserData.role === 'Admin' ? (
            <p className="text-green-400 font-medium">
              👑 Admin - Has access to ALL parties
            </p>
          ) : selectedUserData.parties.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {selectedUserData.parties.map((partyId) => {
                const party = parties.find((p) => p.id === partyId);
                return (
                  <li
                    key={partyId}
                    className="text-lightMainColor dark:text-darkMainColor"
                  >
                    {party ? party.name : `Unknown Party (${partyId})`}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-400">No party access granted</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PartyAccessManager;
