import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch, clearAuth, getSavedUser, saveAuth } from '../api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/auth/me');
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (_error) {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email, password, role) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    saveAuth(response.token, response.user);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
