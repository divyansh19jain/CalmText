import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ct_token';
const USER_KEY = 'ct_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = (tokenResponse) => {
    const userData = {
      id: tokenResponse.user_id,
      email: tokenResponse.email,
      name: tokenResponse.name || '',
      username: tokenResponse.username || '',
    };
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(tokenResponse.access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
