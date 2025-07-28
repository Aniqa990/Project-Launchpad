import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, SignupRequest } from '../types';
import { loginUser, signupUser, validateToken } from '../apiendpoints';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: Partial<SignupRequest>) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Set Axios auth header
  useEffect(() => {
    console.log('Token state changed:', token ? 'token exists' : 'token is null');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage');
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Validate token on app startup
  const validateStoredToken = async (savedToken: string) => {
    try {
      console.log('Validating stored token...');
      const response = await validateToken(savedToken);
      console.log('Token validation response:', response);
      
      // If the request succeeds, the token is valid
      return response.valid;
    } catch (error: any) {
      // If we get a 401 or 403, the token is invalid/expired
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token is invalid (401/403)');
        return false;
      }
      // For other errors (network, etc.), we'll assume the token is valid
      // to avoid logging out users due to temporary network issues
      console.log('Network error, assuming token is valid');
      return true;
    }
  };

  // Load auth data on app load
  useEffect(() => {
    if (initialized) {
      console.log('Authentication already initialized, skipping...');
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        setInitialized(true);
        
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          // Validate the token before restoring the session
          const isTokenValid = await validateStoredToken(savedToken);
          
          if (isTokenValid) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } else {
          console.log('📭 No saved user/token found');
        }
      } catch (error) {
        // Clear invalid data on error
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [initialized]);

  // Add axios interceptor to handle 401/403 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token is invalid, logout the user
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { token: newToken, user: userData } = await loginUser(email, password);
    console.log('Login successful:', { user: userData, token: newToken ? 'exists' : 'missing' });
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
  };

  const signup = async (userData: Partial<SignupRequest>) => {
    const response = await signupUser(userData);
    const { token: newToken, user: newUser } = response;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token, signup, updateUser, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Loading your workspace...</p>
          </div>
        </div>
      ) : children}
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
