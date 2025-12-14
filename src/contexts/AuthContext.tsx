import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { profileService } from "../services/profileService";

import { Profile } from "../types/profile";

export type { Profile }; // Re-export for convenience if needed by consumers



interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Auth session check failed:", err);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session Timeout Logic
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const resetTimer = async () => {
      if (timeoutId) clearTimeout(timeoutId);

      // Default to 60 minutes if settings fetch fails or is slow
      // In a real app, we might want to fetch this once and store in context/state
      // For now, we'll use a hardcoded safe default or try to get from local storage if we cached settings
      const timeoutMinutes = 60;

      timeoutId = setTimeout(
        () => {
          console.warn("Session timed out due to inactivity");
          signOut();
        },
        timeoutMinutes * 60 * 1000,
      );
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const profileData = await profileService.getProfile(userId);
      if (profileData) {
        setProfile(profileData as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Force fetching fresh data from DB
      const profileData = await profileService.getProfile(user.id, true);
      if (profileData) {
        setProfile(profileData as Profile);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
