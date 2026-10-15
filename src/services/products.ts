/**
 * Food & Menu Service — Chow
 * Queries Supabase `public.products` and `public.categories`.
 * Integrates local asset mapping and fallback.
 */
import { ImageSourcePropType } from 'react-native';

import { CATEGORIES, FOODS } from '@/data/foods';
import { FoodCategory, FoodItem } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

// Local asset map for visual fidelity when using database records
const LOCAL_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  bole_fish: require('@/assets/images/food/bole_fish.png'),
  jollof_rice: require('@/assets/images/food/jollof_rice.png'),
  afang_soup: require('@/assets/images/food/afang_bowl.png'),
  edikang_ikong: require('@/assets/images/food/edikang_ikong.png'),
  fisherman_soup: require('@/assets/images/food/fisherman_soup.png'),
  banga_soup: require('@/assets/images/food/banga_soup.png'),
  egusi_soup: require('@/assets/images/food/egusi_soup.png'),
  pepper_soup: require('@/assets/images/food/pepper_soup.png'),
  grilled_catfish: require('@/assets/images/food/grilled_catfish.png'),
  peppered_snails: require('@/assets/images/food/peppered_snails.png'),
  concoction_rice: require('@/assets/images/food/concoction_rice.png'),
  yam_porridge: require('@/assets/images/food/yam_porridge.png'),
  fried_yam: require('@/assets/images/food/fried_yam.png'),
  stewed_beans: require('@/assets/images/food/stewed_beans.png'),
  fried_chicken: require('@/assets/images/food/fried_chicken.png'),
  shawarma: require('@/assets/images/food/shawarma.png'),
  zobo_drink: require('@/assets/images/food/zobo_drink.png'),
};

export async function fetchCategories(): Promise<{ id: FoodCategory; label: string; icon: string }[]> {
  if (!isSupabaseConfigured) return CATEGORIES;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return CATEGORIES;

    const list = data.map((c) => ({
      id: c.id as FoodCategory,
      label: c.name,
      icon: c.icon || '🍽️',
    }));

    return [{ id: 'all', label: 'All', icon: '🍽️' }, ...list];
  } catch {
    return CATEGORIES;
  }
}

export async function fetchProducts(categoryId?: FoodCategory): Promise<FoodItem[]> {
  if (!isSupabaseConfigured) {
    if (!categoryId || categoryId === 'all') return FOODS;
    return FOODS.filter((f) => f.category === categoryId);
  }

  try {
    let query = supabase.from('products').select('*').eq('is_available', true);

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (!categoryId || categoryId === 'all') return FOODS;
      return FOODS.filter((f) => f.category === categoryId);
    }

    return data.map(mapDbProductToFoodItem);
  } catch {
    if (!categoryId || categoryId === 'all') return FOODS;
    return FOODS.filter((f) => f.category === categoryId);
  }
}

export async function fetchProductById(id: string): Promise<FoodItem | undefined> {
  if (!isSupabaseConfigured) {
    return FOODS.find((f) => f.id === id);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return FOODS.find((f) => f.id === id);
    }

    return mapDbProductToFoodItem(data);
  } catch {
    return FOODS.find((f) => f.id === id);
  }
}

function mapDbProductToFoodItem(row: any): FoodItem {
  const localImage = LOCAL_IMAGE_MAP[row.id] || LOCAL_IMAGE_MAP.bole_fish;
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    category: row.category_id as FoodCategory,
    basePrice: Number(row.price_kobo) / 100, // convert kobo to Naira
    rating: Number(row.rating),
    reviewCount: row.review_count,
    calories: row.calories,
    prepTime: row.prep_time_text,
    badge: row.badge || undefined,
    restaurant: row.restaurant_name,
    distance: row.distance_text,
    image: localImage,
    isFeatured: row.is_featured,
  };
}
