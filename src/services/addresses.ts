/**
 * Address Service — Chow
 * Address book management interacting with `public.addresses`.
 */
import { DeliveryAddress } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

export async function fetchCustomerAddresses(customerId: string): Promise<DeliveryAddress[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false });

    if (error || !data) return [];

    return data.map((a) => ({
      id: a.id,
      title: a.label,
      street: a.address_line,
      city: `${a.city}, ${a.state}`,
      landmark: a.delivery_instructions || undefined,
      isDefault: a.is_default,
    }));
  } catch {
    return [];
  }
}

export async function createAddress(
  customerId: string,
  address: Omit<DeliveryAddress, 'id'>
): Promise<DeliveryAddress | null> {
  if (!isSupabaseConfigured) {
    return {
      ...address,
      id: `addr_${Date.now()}`,
    };
  }

  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        customer_id: customerId,
        label: address.title,
        address_line: address.street,
        city: 'Calabar',
        state: 'Cross River State',
        delivery_instructions: address.landmark,
        is_default: address.isDefault ?? false,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.label,
      street: data.address_line,
      city: `${data.city}, ${data.state}`,
      landmark: data.delivery_instructions || undefined,
      isDefault: data.is_default,
    };
  } catch {
    return null;
  }
}

export async function deleteAddress(addressId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    return !error;
  } catch {
    return false;
  }
}

export async function setDefaultAddressInDb(addressId: string, customerId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('customer_id', customerId);

    return !error;
  } catch {
    return false;
  }
}
