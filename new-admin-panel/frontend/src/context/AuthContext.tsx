import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const { data } = await authAPI.getMe();
          setUser(data.user || data); // Handle both response formats
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('admin_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('admin_token', data.token);
      setUser(data.user || data); // Handle both response formats
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('admin_token');
      setUser(null);
      queryClient.clear(); // Clear all query caches
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
