/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any; profile?: UserProfile }>;
  register: (email: string, password: string, fullName: string, avatarUrl: string) => Promise<{ error: any; profile?: UserProfile }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile active status & online status
  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (err) {
      console.error('Error updating online status:', err);
    }
  };

  const fetchProfile = async (authUserId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) {
        setProfile(p);
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (p) {
            if (!p.is_active) {
              // User is deactivated
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              alert("Your account has been deactivated. Please contact the administrator.");
            } else {
              setProfile(p);
              await updateOnlineStatus(p.id, true);
            }
          } else {
            // In case profile doesn't exist, we can fallback or auto-create (will handle in register flow too)
            console.warn("No public.users profile found for this user");
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }

      // Listen to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (p) {
            if (!p.is_active) {
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              alert("Your account is deactivated.");
            } else {
              setProfile(p);
              await updateOnlineStatus(p.id, true);
            }
          } else {
            setProfile(null);
          }
        } else {
          // Sign Out event
          if (profile) {
            await updateOnlineStatus(profile.id, false);
          }
          setUser(null);
          setProfile(null);
        }
      });

      authSubscription = subscription;
    };

    initAuth();

    // Heartbeat for online status and unload handler
    const handleUnload = () => {
      if (profile) {
        navigator.sendBeacon(
          `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${profile.id}`,
          JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.id, profile?.id]);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      if (data?.user) {
        const p = await fetchProfile(data.user.id);
        if (p) {
          if (!p.is_active) {
            await supabase.auth.signOut();
            return { error: new Error('Your account has been deactivated by an admin.') };
          }
          setProfile(p);
          await updateOnlineStatus(p.id, true);
          return { error: null, profile: p };
        } else {
          return { error: new Error('No public user profile found. Please register properly.') };
        }
      }
      return { error: new Error('Unknown login error') };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Register handler (creates auth account + inserts profile directly as fallback to RLS/Trigger)
  const register = async (email: string, password: string, fullName: string, avatarUrl: string) => {
    try {
      // 1. Auth Sign Up
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };

      if (data?.user) {
        // 2. Insert into public.users
        const uProfile = {
          auth_user_id: data.user.id,
          email: email,
          full_name: fullName,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
          role: email.toLowerCase().includes('admin') || email === 'admin@example.com' ? 'admin' : 'user',
          is_active: true,
          is_online: true,
          last_seen: new Date().toISOString()
        };

        const { data: insertedData, error: dbError } = await supabase
          .from('users')
          .insert([uProfile])
          .select()
          .single();

        if (dbError) {
          console.error("Database registration failed:", dbError);
          // If profile insert failed, try to query in case a database trigger did it
          const p = await fetchProfile(data.user.id);
          if (p) {
            setProfile(p);
            return { error: null, profile: p };
          }
          return { error: dbError };
        }

        const freshProfile = insertedData as UserProfile;
        setProfile(freshProfile);
        return { error: null, profile: freshProfile };
      }
      return { error: new Error('Registration failed to create credentials.') };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Logout handler
  const signOut = async () => {
    if (profile) {
      await updateOnlineStatus(profile.id, false);
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { error: new Error('Not logged in') };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile((prev) => prev ? { ...prev, ...updates } : null);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
