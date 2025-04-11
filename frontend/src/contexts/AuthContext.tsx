import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  isAdmin: boolean | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async (tokenToUse: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth/me/is_admin', {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin status');
      }
      
      const data = await response.json();
      setIsAdmin(data === true);
    } catch (error) {
      console.error('[Auth] Error fetching user role:', error);
      setError('Failed to authenticate user');
      localStorage.removeItem('token');
      setToken(null);
      setIsAdmin(null);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    await fetchUserRole(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdmin(null);
    setIsInitialized(true);
    setIsLoading(false);
    setError(null);
    window.dispatchEvent(new Event('app-logout'));
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        await fetchUserRole(storedToken);
      } else {
        setIsAdmin(null);
        setToken(null);
        setIsInitialized(true);
        setIsLoading(false);
        setError(null);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        isAdmin, 
        isInitialized, 
        isLoading,
        error, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}