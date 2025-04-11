import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { routes } from './config/routes';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const renderRoutes = (routes: typeof import('./config/routes').routes) => {
  return routes.map(route => {
    if (route.children) {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ErrorBoundary>
              <ProtectedRoute 
                isLayout 
                requireAdmin={route.requireAdmin}
                requireUser={route.requireUser}
              />
            </ErrorBoundary>
          }
        >
          {route.children.map(child => 
            child.index ? (
              <Route
                index
                key="index"
                element={
                  <ErrorBoundary>
                    {child.element}
                  </ErrorBoundary>
                }
              />
            ) : (
              <Route
                key={child.path}
                path={child.path}
                element={
                  <ErrorBoundary>
                    {child.element}
                  </ErrorBoundary>
                }
              />
            )
          )}
        </Route>
      );
    }

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <ErrorBoundary>
            {route.public ? (
              route.element
            ) : (
              <ProtectedRoute
                element={route.element}
                requireAdmin={route.requireAdmin}
                requireUser={route.requireUser}
              />
            )}
          </ErrorBoundary>
        }
      />
    );
  });
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Suspense fallback={<LoadingScreen />}>
              <main className="max-w-7xl mx-auto py-12">
                <Routes>
                  {renderRoutes(routes)}
                  <Route 
                    path="*" 
                    element={
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Page not found
                        </h2>
                        <p className="text-gray-600">
                          The page you're looking for doesn't exist.
                        </p>
                      </div>
                    } 
                  />
                </Routes>
              </main>
            </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
