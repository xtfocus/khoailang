import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, LogOut } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/' && 
                        location.pathname !== '/admin' && 
                        location.pathname !== '/dashboard';

  const handleLogout = () => {
    // Clear storage
    localStorage.removeItem('token');

    // Emit logout event
    window.dispatchEvent(new Event('app-logout'));

    // Redirect to home with replace to prevent back navigation
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
        
        {localStorage.getItem('token') && (
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-1" />
            Logout
          </button>
        )}
      </div>
    </header>
  );
}