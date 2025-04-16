import { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  token: string | null;
  isAdmin: boolean | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async (tokenToUse: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth/me', {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const profile = await response.json();
      setUserProfile(profile);
      setIsAdmin(profile.is_admin);
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error);
      setError('Failed to authenticate user');
      localStorage.removeItem('token');
      setToken(null);
      setIsAdmin(null);
      setUserProfile(null);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    await fetchUserProfile(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdmin(null);
    setUserProfile(null);
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
        await fetchUserProfile(storedToken);
      } else {
        setIsAdmin(null);
        setToken(null);
        setUserProfile(null);
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
        userProfile,
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