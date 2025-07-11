import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, SignupRequest } from '../types';
import { loginUser, signupUser } from '../apiendpoints';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: 'client' | 'freelancer') => Promise<void>;
  logout: () => void;
  signup: (userData: Partial<SignupRequest>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set Axios auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load auth data on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'client' | 'freelancer') => {
    const { token: newToken, user: userData } = await loginUser(email, password, role);
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const signup = async (userData: Partial<SignupRequest>) => {
    const { token: newToken, user: newUser } = await signupUser(userData);
    console.log(newUser)
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token, signup, isAuthenticated: !!user }}>
      {loading ? <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">Loading...</div> : children}
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
