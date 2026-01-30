import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { keriAuthService } from '../services/keriAuthService';

interface KERIAuthContextType {
  isAuthorized: boolean;
  aid: string | null;
  extensionId: string | false | null;
  isExtensionInstalled: boolean;
  loading: boolean;
  error: string | null;
  authorize: (message?: string) => Promise<void>;
  logout: () => void;
}

const KERIAuthContext = createContext<KERIAuthContextType | undefined>(undefined);

export function KERIAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [aid, setAid] = useState<string | null>(null);
  const [extensionId, setExtensionId] = useState<string | false | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize extension check on mount
  useEffect(() => {
    keriAuthService.initialize()
      .then((id) => {
        console.log('[AuthContext] Extension ID:', id);
        setExtensionId(id);
      })
      .catch(err => {
        console.error('[AuthContext] Init error:', err.message);
        setError(err.message);
      });
  }, []);

  const authorize = async (message?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await keriAuthService.authorize(message);
      
      // Update state in a single batch to prevent multiple re-renders
      setIsAuthorized(true);
      setAid(result.identifier?.prefix || null);
      setLoading(false);
      
      console.log('[AuthContext] Authorization successful:', result.identifier?.prefix);
    } catch (err: any) {
      console.error('[AuthContext] Authorization failed:', err);
      setError(err.message || 'Authorization failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    keriAuthService.reset();
    setIsAuthorized(false);
    setAid(null);
  };

  const isExtensionInstalled = extensionId !== false && extensionId !== null;

  return (
    <KERIAuthContext.Provider 
      value={{ 
        isAuthorized, 
        aid, 
        extensionId, 
        isExtensionInstalled,
        loading, 
        error, 
        authorize, 
        logout 
      }}
    >
      {children}
    </KERIAuthContext.Provider>
  );
}

export function useKERIAuth() {
  const context = useContext(KERIAuthContext);
  if (!context) {
    throw new Error('useKERIAuth must be used within KERIAuthProvider');
  }
  return context;
}

// Keep backward compatibility - export as AuthProvider and useAuth as well
export const AuthProvider = KERIAuthProvider;
export const useAuth = useKERIAuth;
