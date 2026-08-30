import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('artisanloft_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username, password) => {
    const defaultUsers = {
      'admin': { password: 'admin123', role: 'ADMIN', name: 'Admin User', email: 'admin@artisanloft.in', phone: '+91 80 4567 8900' },
      'user': { password: 'password', role: 'USER', name: 'Guest User', email: 'guest@example.com', phone: '+91 98765 43210' },
      'rahul.sharma': { password: 'rahul123', role: 'USER', name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '+91 98765 12345' },
      'priya.patel': { password: 'priya123', role: 'USER', name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '+91 87654 32100' }
    };

    const registeredUsers = JSON.parse(localStorage.getItem('artisanloft_registered_users') || '{}');
    const allUsers = { ...defaultUsers, ...registeredUsers };

    const userInfo = allUsers[username];
    if (userInfo && userInfo.password === password) {
      const userData = {
        username,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone || '+91 98765 43210',
        role: userInfo.role,
        joinDate: userInfo.joinDate || '2024-01-15',
        city: userInfo.city || 'Bangalore',
        avatar: userInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name)}&background=ea580c&color=fff&size=128`
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('artisanloft_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('artisanloft_user');
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('artisanloft_user', JSON.stringify(updatedUser));
  };

  const register = (formData) => {
    const existingUsers = JSON.parse(localStorage.getItem('artisanloft_registered_users') || '{}');
    
    if (existingUsers[formData.username]) {
      return { success: false, error: 'Username already exists' };
    }

    const newUser = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      role: 'USER',
      joinDate: new Date().toISOString().split('T')[0],
      city: '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=ea580c&color=fff&size=128`
    };

    existingUsers[formData.username] = { ...newUser, password: formData.password };
    localStorage.setItem('artisanloft_registered_users', JSON.stringify(existingUsers));

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('artisanloft_user', JSON.stringify(newUser));
    
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      updateProfile,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
