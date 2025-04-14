import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export function UserProfile() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-semibold">
            {(userProfile.username?.[0] || userProfile.email[0]).toUpperCase()}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {userProfile.username || userProfile.email.split('@')[0]}
            </h2>
            <p className="text-gray-500">{userProfile.is_admin ? 'Administrator' : 'User'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{userProfile.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-gray-900">{userProfile.username || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-gray-900">{formatDate(userProfile.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}