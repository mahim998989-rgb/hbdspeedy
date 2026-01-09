import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if running in Telegram Web App
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          const user = tg.initDataUnsafe?.user;
          if (user) {
            await authenticateTelegramUser(user);
          } else {
            setLoading(false);
          }
        } else {
          // For testing outside Telegram - create a demo user
          if (token) {
            await fetchUserProfile();
          } else {
            // Auto-login with demo user for testing
            await authenticateDemoUser();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const authenticateTelegramUser = async (telegramUser) => {
    try {
      const response = await apiClient.post('/auth/telegram', {
        telegram_id: telegramUser.id,
        username: telegramUser.username || telegramUser.first_name,
        first_name: telegramUser.first_name
      });

      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const authenticateDemoUser = async () => {
    try {
      // Create a demo user for testing
      const demoTelegramId = 999999999;
      const response = await apiClient.post('/auth/telegram', {
        telegram_id: demoTelegramId,
        username: 'demo_user',
        first_name: 'Demo'
      });

      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Demo authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/user/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username, password) => {
    try {
      const response = await apiClient.post('/admin/login', {
        username,
        password
      });

      const { token: newToken } = response.data;
      setToken(newToken);
      setIsAdmin(true);
      localStorage.setItem('token', newToken);
      localStorage.setItem('isAdmin', 'true');
      return true;
    } catch (error) {
      console.error('Admin login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        setUser,
        adminLogin,
        logout,
        refreshUser: fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);