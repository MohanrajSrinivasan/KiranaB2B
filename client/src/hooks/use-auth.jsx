import { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = AuthService.getStoredUser();
        if (storedUser) {
          // Verify session with server
          const freshUser = await AuthService.refreshSession();
          setUser(freshUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        AuthService.removeUser();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const value = {
    user,
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        AuthService.saveUser(newUser);
      } else {
        AuthService.removeUser();
      }
    },
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}