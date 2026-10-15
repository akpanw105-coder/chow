import { FoodCategory, FoodItem } from '@/types';

// ─── Food Data ────────────────────────────────────────────────────────────────
// Prices and content derived from the Stitch design exports.
// All prices in Nigerian Naira (₦).

export const FOODS: FoodItem[] = [
  {
    id: 'bole_fish',
    name: 'Calabar Bole & Grilled Mackerel',
    shortName: 'Calabar Bole & Fish',
    description:
      'Port Harcourt-style roasted plantain (bole) — ripe and unripe — served alongside whole charcoal-grilled spiced mackerel, with fresh sliced cucumber, tomato, and a generous drizzle of peppered palm oil sauce.',
    category: 'grills',
    basePrice: 5200,
    rating: 4.8,
    reviewCount: '1.2k+',
    calories: 780,
    prepTime: '25-35 min',
    badge: "Chef's Special",
    restaurant: 'Calabar Kitchen',
    distance: '1.2 Km',
    image: require('@/assets/images/food/bole_fish.png'),
    isFeatured: true,
  },
  {
    id: 'jollof_rice',
    name: 'Smoky Party Jollof & Fried Plantain',
    shortName: 'Smoky Jollof & Dodo Platter',
    description:
      'Vibrant smoky reddish-orange long-grain rice slow-cooked over firewood with tomatoes, peppers, and secret spices. Served with golden fried ripe plantain (dodo) and your choice of grilled chicken or beef.',
    category: 'rice',
    basePrice: 3800,
    rating: 4.9,
    reviewCount: '2k+',
    calories: 920,
    prepTime: '20-30 min',
    badge: "Chef's Special",
    restaurant: 'Rivers Aroma',
    distance: '2.5 Km',
    image: require('@/assets/images/food/jollof_rice.png'),
    isFeatured: true,
  },
  {
    id: 'afang_soup',
    name: 'Afang Soup & Swallow',
    shortName: 'Afang Soup & Swallow',
    description:
      'Traditional Cross River delicacy slow-cooked with fresh shredded afang and waterleaves, rich palm oil, smoked dried fish, periwinkles, kpomo, and tender assorted beef. Served piping hot with your choice of swallow.',
    category: 'soups',
    basePrice: 6500,
    rating: 4.9,
    reviewCount: '1.4k+',
    calories: 620,
    prepTime: '20-30 min',
    restaurant: 'Calabar Kitchen',
    distance: '1.2 Km',
    image: require('@/assets/images/food/afang_bowl.png'),
    swallowOptions: [
      { id: 'pounded_yam', label: 'Pounded Yam' },
      { id: 'garri_eba', label: 'Garri / Eba' },
      { id: 'fufu_akpu', label: 'Fufu / Akpu' },
      { id: 'semovita', label: 'Semovita' },
    ],
    portionOptions: [
      { id: 'standard', label: 'Standard', price: 6500 },
      { id: 'jumbo', label: 'Jumbo Assorted', price: 8500 },
    ],
  },
  {
    id: 'edikang_ikong',
    name: 'Edikang Ikong Soup & Swallow',
    shortName: 'Edikang Ikong',
    description:
      'Lush, glossy shredded fluted pumpkin leaves (ugwu) and waterleaf cooked with assorted meats, stockfish, smoked fish, periwinkles, and rich palm oil. A true Calabar classic.',
    category: 'soups',
    basePrice: 7000,
    rating: 4.8,
    reviewCount: '980+',
    calories: 590,
    prepTime: '20-35 min',
    restaurant: 'Calabar Kitchen',
    distance: '1.2 Km',
    image: require('@/assets/images/food/edikang_ikong.png'),
    swallowOptions: [
      { id: 'pounded_yam', label: 'Pounded Yam' },
      { id: 'garri_eba', label: 'Garri / Eba' },
      { id: 'fufu_akpu', label: 'Fufu / Akpu' },
      { id: 'semovita', label: 'Semovita' },
    ],
    portionOptions: [
      { id: 'standard', label: 'Standard', price: 7000 },
      { id: 'jumbo', label: 'Jumbo Assorted', price: 9500 },
    ],
  },
  {
    id: 'fisherman_soup',
    name: "Delta Fisherman's Soup",
    shortName: "Fisherman's Soup",
    description:
      'Rich, spicy light palm oil seafood broth loaded with fresh fish, shrimps, crabs, clams, and aromatic herbs. A pride of the Niger Delta waterside.',
    category: 'soups',
    basePrice: 7500,
    rating: 4.9,
    reviewCount: '1.1k+',
    calories: 540,
    prepTime: '30-40 min',
    restaurant: 'Rivers Aroma',
    distance: '2.5 Km',
    image: require('@/assets/images/food/fisherman_soup.png'),
    swallowOptions: [
      { id: 'pounded_yam', label: 'Pounded Yam' },
      { id: 'garri_eba', label: 'Garri / Eba' },
      { id: 'starch', label: 'Starch' },
    ],
    portionOptions: [
      { id: 'standard', label: 'Standard', price: 7500 },
      { id: 'jumbo', label: 'Jumbo (Large)', price: 11000 },
    ],
  },
  {
    id: 'banga_soup',
    name: 'Banga Soup & Starch',
    shortName: 'Banga Soup & Starch',
    description:
      "Urhobo palm nut soup simmered with fresh palm fruit extract, oburunbebe stick, dried catfish, and aromatic Delta spices. Best enjoyed with traditional starch.",
    category: 'soups',
    basePrice: 6800,
    rating: 4.7,
    reviewCount: '760+',
    calories: 680,
    prepTime: '25-40 min',
    restaurant: 'Delta Flavours',
    distance: '3.0 Km',
    image: require('@/assets/images/food/banga_soup.png'),
    swallowOptions: [
      { id: 'starch', label: 'Starch' },
      { id: 'pounded_yam', label: 'Pounded Yam' },
      { id: 'garri_eba', label: 'Garri / Eba' },
    ],
    portionOptions: [
      { id: 'standard', label: 'Standard', price: 6800 },
      { id: 'jumbo', label: 'Jumbo Assorted', price: 9000 },
    ],
  },
  {
    id: 'egusi_soup',
    name: 'Egusi Soup & Swallow',
    shortName: 'Egusi Soup',
    description:
      'Melon seed soup cooked with bitterleaf or spinach, assorted beef and offal, stockfish, smoked fish, and palm oil. Deeply satisfying Nigerian comfort food.',
    category: 'soups',
    basePrice: 5500,
    rating: 4.7,
    reviewCount: '1.5k+',
    calories: 720,
    prepTime: '20-30 min',
    restaurant: 'Naija Kitchen',
    distance: '1.8 Km',
    image: require('@/assets/images/food/egusi_soup.png'),
    swallowOptions: [
      { id: 'pounded_yam', label: 'Pounded Yam' },
      { id: 'garri_eba', label: 'Garri / Eba' },
      { id: 'fufu_akpu', label: 'Fufu / Akpu' },
      { id: 'semovita', label: 'Semovita' },
    ],
    portionOptions: [
      { id: 'standard', label: 'Standard', price: 5500 },
      { id: 'jumbo', label: 'Jumbo Assorted', price: 7500 },
    ],
  },
  {
    id: 'pepper_soup',
    name: 'Niger Delta Seafood Pepper Soup',
    shortName: 'Seafood Pepper Soup',
    description:
      'Aromatic clear herbal broth bursting with fresh shrimp, fish fillets, and clams, infused with calabash nutmeg, uda, and traditional Delta spices.',
    category: 'soups',
    basePrice: 5000,
    rating: 4.8,
    reviewCount: '890+',
    calories: 320,
    prepTime: '15-20 min',
    restaurant: 'Rivers Aroma',
    distance: '2.5 Km',
    image: require('@/assets/images/food/pepper_soup.png'),
  },
  {
    id: 'grilled_catfish',
    name: 'Point & Kill Grilled Catfish',
    shortName: 'Grilled Catfish',
    description:
      'Fresh whole catfish grilled over hot coals, basted with spicy pepper marinade and palm oil. A waterside Nigerian classic served with sliced onions and tomatoes.',
    category: 'grills',
    basePrice: 8500,
    rating: 4.9,
    reviewCount: '640+',
    calories: 480,
    prepTime: '30-40 min',
    restaurant: 'Waterside Grill',
    distance: '4.1 Km',
    image: require('@/assets/images/food/grilled_catfish.png'),
  },
  {
    id: 'peppered_snails',
    name: 'Peppered Snails (Nkono)',
    shortName: 'Peppered Snails',
    description:
      'Giant African land snails braised and tossed in a bold peppered tomato sauce with onions, scotch bonnet, and fragrant spices. A premium Nigerian delicacy.',
    category: 'specials',
    basePrice: 4500,
    rating: 4.8,
    reviewCount: '520+',
    calories: 280,
    prepTime: '20-25 min',
    badge: 'Specials',
    restaurant: 'Naija Kitchen',
    distance: '1.8 Km',
    image: require('@/assets/images/food/peppered_snails.png'),
  },
  {
    id: 'concoction_rice',
    name: 'Iwuk Edesi (Concoction Rice)',
    shortName: 'Concoction Rice',
    description:
      'Niger Delta-style native rice cooked in pure palm oil with dried fish, crayfish, and fresh peppers. A deeply aromatic one-pot meal bursting with bold flavours.',
    category: 'rice',
    basePrice: 3500,
    rating: 4.6,
    reviewCount: '430+',
    calories: 860,
    prepTime: '25-35 min',
    restaurant: 'Delta Flavours',
    distance: '3.0 Km',
    image: require('@/assets/images/food/concoction_rice.png'),
  },
  {
    id: 'yam_porridge',
    name: 'Asaro (Yam Porridge)',
    shortName: 'Yam Porridge',
    description:
      'Tender yam pottage simmered in seasoned palm oil broth with tomatoes, peppers, smoked fish, and leafy greens. Comforting Nigerian home cooking.',
    category: 'specials',
    basePrice: 3200,
    rating: 4.5,
    reviewCount: '380+',
    calories: 540,
    prepTime: '20-30 min',
    restaurant: 'Naija Kitchen',
    distance: '1.8 Km',
    image: require('@/assets/images/food/yam_porridge.png'),
  },
  {
    id: 'fried_yam',
    name: 'Fried Yam (Dundu) & Pepper Sauce',
    shortName: 'Fried Yam & Pepper Sauce',
    description:
      'Thick golden-crusted fried yam wedges served with spicy blended pepper dipping sauce. Classic Nigerian street food done right.',
    category: 'snacks',
    basePrice: 2500,
    rating: 4.4,
    reviewCount: '920+',
    calories: 620,
    prepTime: '15-20 min',
    restaurant: 'Naija Kitchen',
    distance: '1.8 Km',
    image: require('@/assets/images/food/fried_yam.png'),
  },
  {
    id: 'stewed_beans',
    name: 'Ewa Aganyin (Stewed Beans & Plantain)',
    shortName: 'Ewa Aganyin & Plantain',
    description:
      'Honey beans slow-cooked until tender, served with authentic Aganyin pepper sauce and golden fried ripe plantain. Lagos street food royalty.',
    category: 'specials',
    basePrice: 2800,
    rating: 4.5,
    reviewCount: '1.1k+',
    calories: 680,
    prepTime: '15-25 min',
    restaurant: 'Naija Kitchen',
    distance: '1.8 Km',
    image: require('@/assets/images/food/stewed_beans.png'),
  },
  {
    id: 'fried_chicken',
    name: 'Crispy Seasoned Fried Chicken',
    shortName: 'Crispy Fried Chicken',
    description:
      'Golden, perfectly seasoned Nigerian-style fried chicken with a thick, crunchy crust. Served with your choice of coleslaw, spiced rice, or jollof.',
    category: 'grills',
    basePrice: 3200,
    rating: 4.6,
    reviewCount: '1.8k+',
    calories: 820,
    prepTime: '20-30 min',
    restaurant: 'Crispy Corner',
    distance: '2.1 Km',
    image: require('@/assets/images/food/fried_chicken.png'),
  },
  {
    id: 'shawarma',
    name: 'Nigerian Street Shawarma',
    shortName: 'Chicken Shawarma',
    description:
      'Warm toasted pita flatbread wrap filled with seasoned grilled chicken strips, fresh vegetables, coleslaw, and creamy garlic sauce. Street-style perfection.',
    category: 'snacks',
    basePrice: 2200,
    rating: 4.4,
    reviewCount: '2.3k+',
    calories: 520,
    prepTime: '10-15 min',
    restaurant: 'Crispy Corner',
    distance: '2.1 Km',
    image: require('@/assets/images/food/shawarma.png'),
  },
  {
    id: 'zobo_drink',
    name: 'Gourmet Zobo & Chapman',
    shortName: 'Zobo Chapman Drink',
    description:
      'Refreshing hibiscus drink blended with fresh fruits, Chapman fizz, pineapple juice, and a hint of ginger. Served ice-cold with mint garnish.',
    category: 'drinks',
    basePrice: 1500,
    rating: 4.7,
    reviewCount: '670+',
    calories: 120,
    prepTime: '5-10 min',
    restaurant: 'Sip & Chill',
    distance: '1.5 Km',
    image: require('@/assets/images/food/zobo_drink.png'),
  },
];

// ─── Hero Banner Items ────────────────────────────────────────────────────────
export const HERO_BANNERS = [
  {
    id: 'hero_bole',
    foodId: 'bole_fish',
    image: require('@/assets/images/hero/bole_hero.png'),
    title: 'Calabar Bole & Fish',
    subtitle: 'South-South Classic',
    price: 5200,
  },
  {
    id: 'hero_jollof',
    foodId: 'jollof_rice',
    image: require('@/assets/images/hero/jollof_hero.png'),
    title: 'Party Jollof & Dodo',
    subtitle: "Chef's Special Today",
    price: 3800,
  },
];

// ─── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES: { id: FoodCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'soups', label: 'Soups', icon: '🍲' },
  { id: 'rice', label: 'Rice', icon: '🍚' },
  { id: 'grills', label: 'Grills', icon: '🔥' },
  { id: 'snacks', label: 'Snacks', icon: '🥙' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'specials', label: 'Specials', icon: '⭐' },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
export function getFoodById(id: string): FoodItem | undefined {
  return FOODS.find((f) => f.id === id);
}

export function getFoodsByCategory(category: FoodCategory): FoodItem[] {
  if (category === 'all') return FOODS;
  return FOODS.filter((f) => f.category === category);
}

export function getFeaturedFoods(): FoodItem[] {
  return FOODS.filter((f) => f.isFeatured);
}

export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
