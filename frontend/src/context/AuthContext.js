import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const normalizeUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  const metadata = supabaseUser.user_metadata || {};
  const name =
    metadata.full_name ||
    metadata.name ||
    supabaseUser.email?.split('@')[0] ||
    'Artisan Member';

  return {
    ...supabaseUser,
    id: supabaseUser.id,
    email: supabaseUser.email,
    name,
    phone: metadata.phone || supabaseUser.phone || '',
    city: metadata.city || '',
    role: supabaseUser.app_metadata?.role || metadata.role || 'customer',
    joinDate: supabaseUser.created_at
      ? supabaseUser.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0],
    avatar:
      metadata.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=3b2a1e&color=fff&size=128`,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch current active session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session: activeSession } }) => {
        if (isMounted) {
          setSession(activeSession);
          setUser(normalizeUser(activeSession?.user));
          setIsAuthenticated(Boolean(activeSession?.user));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching Supabase session:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    // 2. Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(normalizeUser(currentSession?.user));
        setIsAuthenticated(Boolean(currentSession?.user));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      setUser(normalizeUser(data.user));
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signup = async (formData) => {
    try {
      const email = formData.email?.trim();
      const password = formData.password;
      const name = formData.name?.trim() || '';
      const phone = formData.phone?.trim() || '';
      const city = formData.city?.trim() || '';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            phone,
            city,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase has email confirmation turned off, session is returned immediately
      if (data.session) {
        setSession(data.session);
        setUser(normalizeUser(data.user));
        setIsAuthenticated(true);
      }

      return {
        success: true,
        data,
        needsEmailConfirmation: !data.session,
      };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to sign up' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(normalizeUser(data.user));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token || null,
        isAuthenticated,
        loading,
        login,
        signup,
        register: signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
