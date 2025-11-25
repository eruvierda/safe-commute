import { supabase } from '../supabaseClient';

export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function requireAuth(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
