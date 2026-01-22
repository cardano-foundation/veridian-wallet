import React, { createContext, useContext, useState, useEffect } from 'react';
import { keriAuthService } from '../services/keriAuthService';

interface AuthContextType {
  aid: string | null;
  isAuthorized: boolean;
  authorize: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aid, setAid] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const authorize = async () => {
    try {
      await keriAuthService.authorize();
      const userAid = keriAuthService.getAID();
      setAid(userAid);
      setIsAuthorized(true);
    } catch (error) {
      console.error('Authorization failed:', error);
    }
  };

  const disconnect = async () => {
    await keriAuthService.disconnect();
    setAid(null);
    setIsAuthorized(false);
  };

  return (
    <AuthContext.Provider value={{ aid, isAuthorized, authorize, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
