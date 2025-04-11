import React from 'react';
import { User, ClipboardList, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminWelcomeScreen() {
  const navigate = useNavigate();

  const handleActionSelect = (action: string) => {
    switch (action) {
      case 'waitlist':
        navigate('/admin/waitlist');
        break;
      case 'users':
        // To be implemented
        break;
      case 'profile':
        // To be implemented
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => handleActionSelect('waitlist')}
          className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex flex-col items-center space-y-4">
            <ClipboardList className="w-16 h-16 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Manage Waitlist</h2>
            <p className="text-gray-500 text-center">
              Approve or reject waitlist entries
            </p>
          </div>
        </button>

        <button
          onClick={() => handleActionSelect('users')}
          className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex flex-col items-center space-y-4">
            <Users className="w-16 h-16 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
            <p className="text-gray-500 text-center">
              View, add, or remove users
            </p>
          </div>
        </button>

        <button
          onClick={() => handleActionSelect('profile')}
          className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex flex-col items-center space-y-4">
            <User className="w-16 h-16 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">View Profile</h2>
            <p className="text-gray-500 text-center">
              Update your admin profile
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}