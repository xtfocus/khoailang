import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();
  
  const showBackButton = location.pathname !== '/' && 
                        location.pathname !== '/admin' && 
                        location.pathname !== '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">KhoaiLang</h1>
        </div>
        
        {userProfile && (
          <div className="flex items-center gap-4">
            <div className="flex items-center text-gray-600">
              <User className="w-5 h-5 mr-2" />
              <span>Welcome, {userProfile.username || userProfile.email.split('@')[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-1" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}