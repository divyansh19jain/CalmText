import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

  // A stored token can be expired, or signed with a JWT secret the server no
  // longer uses. The API answers 401, but every caller swallows that error, so
  // without this the app sits in a fake logged-in state: it refires the same
  // requests on every mount and PublicOnlyRoute keeps the user out of /login.
  // Treat a 401 from the API as the end of the session.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err?.config?.url || '';
        // A wrong password on the auth routes is a normal failure, not a dead session.
        if (err?.response?.status === 401 && !url.includes('/auth/')) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
