import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const createProfileIfMissing = async (userId: string) => {
        try {
            // Get user metadata from auth.users
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.error('Cannot create profile: user not authenticated');
                return null;
            }

            // Extract display name from user metadata or email
            const displayName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'Anonymous User';

            const avatarUrl = user.user_metadata?.avatar_url || null;

            console.log('Creating profile for user:', userId);

            // Insert new profile
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                })
                .select()
                .single();

            if (error) {
                // Check if it's a duplicate key error (profile already exists)
                if (error.code === '23505') {
                    console.log('Profile already exists, fetching it...');
                    return await fetchProfileDirect(userId);
                }
                console.error('Error creating profile:', error);
                return null;
            }

            console.log('Profile created successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in createProfileIfMissing:', error);
            return null;
        }
    };

    const fetchProfileDirect = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile directly:', error);
            return null;
        }

        return data;
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116 means no rows returned (profile doesn't exist)
                if (error.code === 'PGRST116') {
                    console.warn('Profile not found, creating one...', { userId, error });
                    const newProfile = await createProfileIfMissing(userId);
                    if (newProfile) {
                        setProfile(newProfile);
                    }
                } else {
                    console.error('Error fetching profile:', error);
                }
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Refresh profile
            await fetchProfile(user.id);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const value = {
        user,
        session,
        profile,
        loading,
        signOut,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
