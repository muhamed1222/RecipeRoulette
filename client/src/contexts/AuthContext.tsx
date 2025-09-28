import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getFunctionUrl } from '@/lib/functions';

// Check environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Not set');

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Define types
interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Get user role from admin_user table
          const { data: adminUser, error } = await supabase
            .from('admin_user')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!error && adminUser) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: adminUser.role
            });
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
      if (session) {
        // Get user role from admin_user table
        supabase
          .from('admin_user')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: adminUser, error }: { data: any; error: any }) => {
            if (!error && adminUser) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: adminUser.role
              });
            }
          });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, companyName: string) => {
    setLoading(true);
    try {
      console.log('Attempting to register user:', { email, companyName });
      
      // Check if we have the required environment variables
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration. Please check your environment variables.');
      }
      
      // Log the request details
      const registerUrl = getFunctionUrl('admin/register');
      console.log('Making request to', registerUrl);
      console.log('Current window location:', window.location.href);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (supabaseAnonKey) {
        headers['apikey'] = supabaseAnonKey;
        headers['Authorization'] = headers['Authorization'] ?? `Bearer ${supabaseAnonKey}`;
      }

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, companyName })
      });

      console.log('Registration response status:', response.status);
      // Convert headers to object for logging
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log('Registration response headers:', headersObj);
      const contentType = response.headers.get('content-type') || '';
      let responseData: { success: boolean; error?: string } | null = null;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Registration response data:', responseData);
      } else {
        const textBody = await response.text();
        console.log('Registration response (non-json):', textBody);
      }

      if (!responseData) {
        throw new Error('Получен неожиданный ответ от сервера Supabase. Проверьте конфигурацию прокси.');
      }

      if (!response.ok || !responseData.success) {
        const errorMessage = responseData.error || 'Не удалось зарегистрироваться';
        console.error('Registration failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in after registration failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
