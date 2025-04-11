import React, { useState, useEffect } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  reason: string | null;
  approved: boolean;
  created_at: string;
}

export function WaitlistManager() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    try {
      const response = await fetch('/auth/waitlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch waitlist');
      }

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  const approveEntry = async (id: number) => {
    try {
      const response = await fetch(`/auth/waitlist/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve entry');
      }

      // Refresh the waitlist after approval
      fetchWaitlist();
    } catch (err) {
      setError('Failed to approve entry');
    }
  };

  const deleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this waitlist entry?')) {
      return;
    }

    try {
      const response = await fetch(`/auth/waitlist/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete entry');
      }

      // Remove the entry from the local state
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Waitlist</h2>
        <button
          onClick={() => navigate('/admin')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Back to Dashboard
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-center">No entries in the waitlist</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{entry.reason || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-4">
                      {!entry.approved && (
                        <button
                          onClick={() => approveEntry(entry.id)}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}