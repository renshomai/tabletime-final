import { supabase, UserRole } from './supabase';

export async function signUp(email: string, password: string, fullName: string, phone: string, role: UserRole = 'customer') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', data.user.id);

    if (profileError) console.error('Error updating phone:', profileError);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    (async () => {
      if (session?.user) {
        const profile = await getCurrentUser();
        callback(profile);
      } else {
        callback(null);
      }
    })();
  });
}
