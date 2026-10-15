-- ============================================================================
-- CHOW FOOD DELIVERY — COMPLETE DATABASE SCHEMA MIGRATION (05 Seed Data)
-- Target: PostgreSQL / Supabase
-- Description: Authentic South-South Nigerian Food Menu Seed Data
-- ============================================================================

-- ─── 1. CATEGORIES SEED ──────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, description, icon, sort_order, is_active)
VALUES
    ('soups', 'Soups & Swallows', 'soups', 'Rich traditional Calabar & Niger Delta soups simmered with fresh herbs, palm oil, and seafood.', '🍲', 1, true),
    ('rice', 'Rice Dishes', 'rice', 'Smoky firewood party jollof, fried rice, and native concoction rice.', '🍚', 2, true),
    ('grills', 'Charcoal Grills & Bole', 'grills', 'Street-side Port Harcourt & Calabar roasted plantain with grilled mackerel, chicken, and catfish.', '🔥', 3, true),
    ('snacks', 'Finger Foods & Snacks', 'snacks', 'Crispy fried yam, street shawarma, meat pies, and puff puff.', '🥙', 4, true),
    ('drinks', 'Chilled Drinks', 'drinks', 'Authentic gourmet zobo, Chapman, fresh palm wine, and citrus juices.', '🥤', 5, true),
    ('specials', 'Chef Specials & Delicacies', 'specials', 'Premium peppered snails (nkono), asaro yam porridge, and ewa aganyin.', '⭐', 6, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- ─── 2. PRODUCTS SEED ────────────────────────────────────────────────────────
-- All prices in integer Kobo (1 NGN = 100 kobo)
INSERT INTO public.products (
    id, category_id, name, short_name, slug, description, price_kobo,
    rating, review_count, calories, preparation_time_minutes, prep_time_text,
    badge, restaurant_name, distance_text, is_available, is_featured
)
VALUES
    (
        'bole_fish',
        'grills',
        'Calabar Bole & Grilled Mackerel',
        'Calabar Bole & Fish',
        'calabar-bole-and-grilled-mackerel',
        'Port Harcourt-style roasted plantain (bole) — ripe and unripe — served alongside whole charcoal-grilled spiced mackerel, with fresh sliced cucumber, tomato, and a generous drizzle of peppered palm oil sauce.',
        520000, -- ₦5,200.00
        4.85, '1.2k+', 780, 30, '25-35 min',
        'Chef''s Special', 'Calabar Kitchen', '1.2 Km', true, true
    ),
    (
        'jollof_rice',
        'rice',
        'Smoky Party Jollof & Fried Plantain',
        'Smoky Jollof & Dodo Platter',
        'smoky-party-jollof-and-fried-plantain',
        'Vibrant smoky reddish-orange long-grain rice slow-cooked over firewood with tomatoes, peppers, and secret spices. Served with golden fried ripe plantain (dodo) and your choice of grilled chicken or beef.',
        380000, -- ₦3,800.00
        4.92, '2k+', 920, 25, '20-30 min',
        'Chef''s Special', 'Rivers Aroma', '2.5 Km', true, true
    ),
    (
        'afang_soup',
        'soups',
        'Afang Soup & Swallow',
        'Afang Soup & Swallow',
        'afang-soup-and-swallow',
        'Traditional Cross River delicacy slow-cooked with fresh shredded afang and waterleaves, rich palm oil, smoked dried fish, periwinkles, kpomo, and tender assorted beef. Served piping hot with your choice of swallow.',
        650000, -- ₦6,500.00
        4.90, '1.4k+', 620, 25, '20-30 min',
        'Popular', 'Calabar Kitchen', '1.2 Km', true, true
    ),
    (
        'edikang_ikong',
        'soups',
        'Edikang Ikong Soup & Swallow',
        'Edikang Ikong',
        'edikang-ikong-soup-and-swallow',
        'Lush, glossy shredded fluted pumpkin leaves (ugwu) and waterleaf cooked with assorted meats, stockfish, smoked fish, periwinkles, and rich palm oil. A true Calabar classic.',
        700000, -- ₦7,000.00
        4.84, '980+', 590, 30, '20-35 min',
        'Signature', 'Calabar Kitchen', '1.2 Km', true, false
    ),
    (
        'fisherman_soup',
        'soups',
        'Delta Fisherman''s Soup',
        'Fisherman''s Soup',
        'delta-fishermans-soup',
        'Rich, spicy light palm oil seafood broth loaded with fresh fish, shrimps, crabs, clams, and aromatic herbs. A pride of the Niger Delta waterside.',
        750000, -- ₦7,500.00
        4.95, '1.1k+', 540, 35, '30-40 min',
        'Chef''s Special', 'Rivers Aroma', '2.5 Km', true, false
    ),
    (
        'banga_soup',
        'soups',
        'Banga Soup & Starch',
        'Banga Soup & Starch',
        'banga-soup-and-starch',
        'Urhobo palm nut soup simmered with fresh palm fruit extract, oburunbebe stick, dried catfish, and aromatic Delta spices. Best enjoyed with traditional starch.',
        680000, -- ₦6,800.00
        4.76, '760+', 680, 30, '25-40 min',
        NULL, 'Delta Flavours', '3.0 Km', true, false
    ),
    (
        'egusi_soup',
        'soups',
        'Egusi Soup & Swallow',
        'Egusi Soup',
        'egusi-soup-and-swallow',
        'Melon seed soup cooked with bitterleaf or spinach, assorted beef and offal, stockfish, smoked fish, and palm oil. Deeply satisfying Nigerian comfort food.',
        550000, -- ₦5,500.00
        4.72, '1.5k+', 720, 25, '20-30 min',
        NULL, 'Naija Kitchen', '1.8 Km', true, false
    ),
    (
        'pepper_soup',
        'soups',
        'Niger Delta Seafood Pepper Soup',
        'Seafood Pepper Soup',
        'niger-delta-seafood-pepper-soup',
        'Aromatic clear herbal broth bursting with fresh shrimp, fish fillets, and clams, infused with calabash nutmeg, uda, and traditional Delta spices.',
        500000, -- ₦5,000.00
        4.80, '890+', 320, 20, '15-20 min',
        NULL, 'Rivers Aroma', '2.5 Km', true, false
    ),
    (
        'grilled_catfish',
        'grills',
        'Point & Kill Grilled Catfish',
        'Grilled Catfish',
        'point-and-kill-grilled-catfish',
        'Fresh whole catfish grilled over hot coals, basted with spicy pepper marinade and palm oil. A waterside Nigerian classic served with sliced onions and tomatoes.',
        850000, -- ₦8,500.00
        4.91, '640+', 480, 35, '30-40 min',
        'Popular', 'Waterside Grill', '4.1 Km', true, false
    ),
    (
        'peppered_snails',
        'specials',
        'Peppered Snails (Nkono)',
        'Peppered Snails',
        'peppered-snails-nkono',
        'Giant African land snails braised and tossed in a bold peppered tomato sauce with onions, scotch bonnet, and fragrant spices. A premium Nigerian delicacy.',
        450000, -- ₦4,500.00
        4.82, '520+', 280, 20, '20-25 min',
        'Delicacy', 'Naija Kitchen', '1.8 Km', true, false
    ),
    (
        'concoction_rice',
        'rice',
        'Iwuk Edesi (Concoction Rice)',
        'Concoction Rice',
        'iwuk-edesi-concoction-rice',
        'Niger Delta-style native rice cooked in pure palm oil with dried fish, crayfish, and fresh peppers. A deeply aromatic one-pot meal bursting with bold flavours.',
        350000, -- ₦3,500.00
        4.64, '430+', 860, 30, '25-35 min',
        NULL, 'Delta Flavours', '3.0 Km', true, false
    ),
    (
        'yam_porridge',
        'specials',
        'Asaro (Yam Porridge)',
        'Yam Porridge',
        'asaro-yam-porridge',
        'Tender yam pottage simmered in seasoned palm oil broth with tomatoes, peppers, smoked fish, and leafy greens. Comforting Nigerian home cooking.',
        320000, -- ₦3,200.00
        4.58, '380+', 540, 25, '20-30 min',
        NULL, 'Naija Kitchen', '1.8 Km', true, false
    ),
    (
        'fried_yam',
        'snacks',
        'Fried Yam (Dundu) & Pepper Sauce',
        'Fried Yam & Pepper Sauce',
        'fried-yam-dundu-and-pepper-sauce',
        'Thick golden-crusted fried yam wedges served with spicy blended pepper dipping sauce. Classic Nigerian street food done right.',
        250000, -- ₦2,500.00
        4.45, '920+', 620, 15, '15-20 min',
        NULL, 'Naija Kitchen', '1.8 Km', true, false
    ),
    (
        'stewed_beans',
        'specials',
        'Ewa Aganyin (Stewed Beans & Plantain)',
        'Ewa Aganyin & Plantain',
        'ewa-aganyin-stewed-beans-and-plantain',
        'Honey beans slow-cooked until tender, served with authentic Aganyin pepper sauce and golden fried ripe plantain. Lagos street food royalty.',
        280000, -- ₦2,800.00
        4.55, '1.1k+', 680, 20, '15-25 min',
        NULL, 'Naija Kitchen', '1.8 Km', true, false
    ),
    (
        'fried_chicken',
        'grills',
        'Crispy Seasoned Fried Chicken',
        'Crispy Fried Chicken',
        'crispy-seasoned-fried-chicken',
        'Golden, perfectly seasoned Nigerian-style fried chicken with a thick, crunchy crust. Served with your choice of coleslaw, spiced rice, or jollof.',
        320000, -- ₦3,200.00
        4.67, '1.8k+', 820, 25, '20-30 min',
        NULL, 'Crispy Corner', '2.1 Km', true, false
    ),
    (
        'shawarma',
        'snacks',
        'Nigerian Street Shawarma',
        'Chicken Shawarma',
        'nigerian-street-shawarma',
        'Warm toasted pita flatbread wrap filled with seasoned grilled chicken strips, fresh vegetables, coleslaw, and creamy garlic sauce. Street-style perfection.',
        220000, -- ₦2,200.00
        4.40, '2.3k+', 520, 12, '10-15 min',
        'Best Seller', 'Crispy Corner', '2.1 Km', true, false
    ),
    (
        'zobo_drink',
        'drinks',
        'Gourmet Zobo & Chapman',
        'Zobo Chapman Drink',
        'gourmet-zobo-and-chapman',
        'Refreshing hibiscus drink blended with fresh fruits, Chapman fizz, pineapple juice, and a hint of ginger. Served ice-cold with mint garnish.',
        150000, -- ₦1,500.00
        4.78, '670+', 120, 8, '5-10 min',
        'Refreshing', 'Sip & Chill', '1.5 Km', true, false
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    category_id = EXCLUDED.category_id,
    description = EXCLUDED.description,
    price_kobo = EXCLUDED.price_kobo,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    calories = EXCLUDED.calories,
    preparation_time_minutes = EXCLUDED.preparation_time_minutes,
    prep_time_text = EXCLUDED.prep_time_text,
    badge = EXCLUDED.badge,
    restaurant_name = EXCLUDED.restaurant_name,
    distance_text = EXCLUDED.distance_text,
    is_available = EXCLUDED.is_available,
    is_featured = EXCLUDED.is_featured;

-- ─── 3. PRODUCT OPTIONS & OPTION VALUES SEED ─────────────────────────────────
-- Afang Soup Options
DO $$
DECLARE
    v_opt_swallow UUID;
    v_opt_portion UUID;
BEGIN
    INSERT INTO public.product_options (product_id, name, type, is_required, sort_order)
    VALUES ('afang_soup', 'Swallow Choice', 'single', true, 1)
    RETURNING id INTO v_opt_swallow;

    INSERT INTO public.product_option_values (option_id, label, price_delta_kobo, sort_order)
    VALUES
        (v_opt_swallow, 'Pounded Yam', 0, 1),
        (v_opt_swallow, 'Garri / Eba', 0, 2),
        (v_opt_swallow, 'Fufu / Akpu', 0, 3),
        (v_opt_swallow, 'Semovita', 0, 4);

    INSERT INTO public.product_options (product_id, name, type, is_required, sort_order)
    VALUES ('afang_soup', 'Portion Size', 'single', false, 2)
    RETURNING id INTO v_opt_portion;

    INSERT INTO public.product_option_values (option_id, label, price_delta_kobo, sort_order)
    VALUES
        (v_opt_portion, 'Standard Bowl', 0, 1),
        (v_opt_portion, 'Jumbo Assorted (Large)', 200000, 2); -- +₦2,000.00
EXCEPTION
    WHEN OTHERS THEN null;
END $$;
