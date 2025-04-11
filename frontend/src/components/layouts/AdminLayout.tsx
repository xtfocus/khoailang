import { Outlet, NavLink } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }: { isActive: boolean }) =>
                    `${isActive ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/waitlist"
                  className={({ isActive }: { isActive: boolean }) =>
                    `${isActive ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  Waitlist
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
}