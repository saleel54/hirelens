import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cachedUser = localStorage.getItem('hirelens_user');
    try {
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('hirelens_token'));
  const [loading, setLoading] = useState<boolean>(() => {
    const storedToken = localStorage.getItem('hirelens_token');
    const cachedUser = localStorage.getItem('hirelens_user');
    if (storedToken && cachedUser) {
      return false; // Render app instantly optimistically!
    }
    if (storedToken) {
      return true; // Token exists, wait for verification since we don't have user info
    }
    return false; // No token, go straight to login without loading screen
  });

  // Initialize and check persistent session
  const verifySession = async () => {
    const storedToken = localStorage.getItem('hirelens_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('hirelens_user', JSON.stringify(data.user));
        setToken(storedToken);
      } else {
        // Token invalid or session expired
        logout();
      }
    } catch (error: any) {
      console.error('💥 [auth-context-session-error]:', error);
      // Resilience offline check: ONLY wipe session if server explicitly returns 401/403 (unauthorized)
      if (error.status === 401 || error.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = (jwtToken: string, userData: User) => {
    localStorage.setItem('hirelens_token', jwtToken);
    localStorage.setItem('hirelens_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hirelens_token');
    localStorage.removeItem('hirelens_user');
    setToken(null);
    setUser(null);
  };

  const updateUserContext = async () => {
    try {
      const data = await apiClient('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('hirelens_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to sync user data', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
