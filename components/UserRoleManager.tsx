'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

const UserRoleManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roles = ['Admin', 'MC', 'Judge', 'User'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await res.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserUpdate = async (user: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, role: user.role, name: user.name, image: user.image }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      // Optionally, refetch users or show a success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleInputChange = (userId: string, field: keyof User, value: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, [field]: value } : user
      )
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Image URL</th>
            <th className="py-2 px-4 border-b">Image Preview</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => handleInputChange(user.id, 'name', e.target.value)}
                  className="p-2 border rounded w-full"
                />
              </td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">
                <select
                  value={user.role}
                  onChange={(e) => handleInputChange(user.id, 'role', e.target.value)}
                  className="p-2 border rounded"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 px-4 border-b">
                <input
                  type="text"
                  value={user.image || ''}
                  onChange={(e) => handleInputChange(user.id, 'image', e.target.value)}
                  className="p-2 border rounded w-full"
                />
              </td>
              <td className="py-2 px-4 border-b">
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                )}
              </td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => handleUserUpdate(user)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserRoleManager;
