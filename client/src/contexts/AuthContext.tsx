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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hirelens_token'));
  const [loading, setLoading] = useState<boolean>(true);

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
        setToken(storedToken);
      } else {
        // Token invalid or session expired
        logout();
      }
    } catch (error) {
      console.error('💥 [auth-context-session-error]:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = (jwtToken: string, userData: User) => {
    localStorage.setItem('hirelens_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hirelens_token');
    setToken(null);
    setUser(null);
  };

  const updateUserContext = async () => {
    try {
      const data = await apiClient('/auth/me');
      if (data && data.user) {
        setUser(data.user);
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
