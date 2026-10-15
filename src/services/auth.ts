/**
 * Authentication & Profile Service — Chow
 * Integrates with Supabase Auth and `public.profiles` table.
 */
import { DeliveryAddress, UserProfile } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

export async function signUpUser(
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      user: {
        id: `mock_${Date.now()}`,
        fullName,
        email,
        phone: phoneNumber,
        savedAddresses: [],
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    // Fetch created profile (populated by database trigger on_auth_user_created)
    const profile = await fetchUserProfile(data.user.id);
    return {
      success: true,
      user: profile || {
        id: data.user.id,
        fullName,
        email,
        phone: phoneNumber,
        savedAddresses: [],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function signInUser(email: string, password: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      user: {
        id: 'usr_calabar_001',
        fullName: 'Bassey Ekpenyong',
        email,
        phone: '+234 803 456 7890',
        savedAddresses: [
          {
            id: 'addr_1',
            title: 'Home',
            street: '14 Marian Road, Calabar',
            city: 'Calabar, Cross River State',
            landmark: 'Opposite State Library',
            isDefault: true,
          },
        ],
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Invalid user credentials.' };
    }

    const profile = await fetchUserProfile(data.user.id);
    return {
      success: true,
      user: profile || {
        id: data.user.id,
        fullName: data.user.user_metadata?.full_name || 'Valued Customer',
        email: data.user.email || email,
        phone: data.user.user_metadata?.phone_number || '',
        savedAddresses: [],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to sign in.' };
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCurrentSession(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return await fetchUserProfile(session.user.id);
  } catch {
    return null;
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) return null;

    // Fetch addresses
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', userId)
      .order('is_default', { ascending: false });

    const savedAddresses: DeliveryAddress[] = (addresses || []).map((a) => ({
      id: a.id,
      title: a.label,
      street: a.address_line,
      city: `${a.city}, ${a.state}`,
      landmark: a.delivery_instructions || undefined,
      isDefault: a.is_default,
    }));

    const defaultAddr = savedAddresses.find((a) => a.isDefault);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email || '',
      phone: profile.phone_number || '',
      avatarUrl: profile.avatar_url || undefined,
      role: profile.role || 'customer',
      isActive: profile.is_active ?? true,
      savedAddresses,
      defaultAddressId: defaultAddr?.id,
    };
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const payload: Record<string, any> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone_number = updates.phone;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    return !error;
  } catch {
    return false;
  }
}
