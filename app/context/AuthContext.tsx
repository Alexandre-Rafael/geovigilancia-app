// context/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextProps>({ user: null, loading: true });

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
      setUser(userAuth);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};
