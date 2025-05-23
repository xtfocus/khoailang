import { ClipboardList, Users } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminWelcomeScreen() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const displayName = userProfile?.username || userProfile?.email.split('@')[0] || 'Admin';

  const handleActionSelect = (action: string) => {
    switch (action) {
      case 'waitlist':
        navigate('/admin/waitlist');
        break;
      case 'users':
        navigate('/admin/users');
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
        <p className="mt-2 text-gray-600">Manage your admin tasks from here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}