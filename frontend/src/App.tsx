import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import WaitlistForm from './components/WaitlistForm';
import { AdminWelcomeScreen } from './components/AdminWelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { WaitlistManager } from './components/WaitlistManager';
import { Welcome } from './components/Welcome';

function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserRole = async (tokenToUse: string) => {
    try {
      console.log('[App] Checking admin status...');
      const response = await fetch('/auth/me/is_admin', {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin status');
      }
      
      const data = await response.json();
      console.log('[App] Admin check response:', data);
      setIsAdmin(data === true);
    } catch (error) {
      console.error('[App] Error fetching user role:', error);
      localStorage.removeItem('token');
      setToken(null);
      setIsAdmin(null);
    } finally {
      setIsInitialized(true);
    }
  };

  // On mount and token change, check authentication
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('[App] Initial token:', storedToken);
      
      if (storedToken) {
        setToken(storedToken);
        await fetchUserRole(storedToken);
      } else {
        setIsAdmin(null);
        setToken(null);
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setIsAdmin(null);
      setIsInitialized(true);
    };

    window.addEventListener('app-logout', handleLogout);
    return () => window.removeEventListener('app-logout', handleLogout);
  }, []);

  const handleLogin = async (accessToken: string) => {
    console.log('[App] Login handler - received token');
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    await fetchUserRole(accessToken);
  };

  // Show loading state while checking authentication
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  console.log('[App] Render state:', { token, isAdmin, isInitialized });

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12">
          <Routes>
            {/* Home route */}
            <Route 
              path="/" 
              element={
                !token ? (
                  <Welcome />
                ) : isAdmin === true ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />

            {/* Login route */}
            <Route 
              path="/login" 
              element={
                !token ? (
                  <LoginForm onLogin={handleLogin} />
                ) : isAdmin === true ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />

            <Route path="/signup" element={<SignupForm onSignup={() => {}} />} />
            <Route path="/waitlist" element={<WaitlistForm />} />

            {/* Admin routes - strict equality check */}
            <Route 
              path="/admin" 
              element={
                !token ? (
                  <Navigate to="/login" replace />
                ) : isAdmin === true ? (
                  <AdminWelcomeScreen />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            <Route 
              path="/admin/waitlist" 
              element={
                !token ? (
                  <Navigate to="/login" replace />
                ) : isAdmin === true ? (
                  <WaitlistManager />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />

            {/* User routes */}
            <Route 
              path="/dashboard" 
              element={
                !token ? (
                  <Navigate to="/login" replace />
                ) : isAdmin === true ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Dashboard />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
