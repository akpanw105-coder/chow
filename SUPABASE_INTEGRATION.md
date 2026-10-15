# Chow — Supabase Backend Integration Guide

## 1. Overview
The **Chow** food ordering and delivery application backend has been configured and integrated with the active Supabase project (`coco root` / `bdeoqfznozkruoqwovhf`).

### Architecture Highlights
- **Currencies & Minor Units**: Prices and calculations are executed in integer minor units (**Kobo**, 100 kobo = ₦1) across PostgreSQL tables, avoiding floating-point rounding issues.
- **Data Protection**: Strict **Row Level Security (RLS)** policies prevent unauthenticated access and cross-customer data leakage.
- **Server-Side Order Calculation**: The `create_order_secure` RPC recalculates subtotals and totals directly from verified database product prices to prevent price tampering.
- **Local Fallback Resilience**: If network connectivity drops or the database is unconfigured, the app falls back to local data.

---

## 2. Supabase Resources Deployed

### Database Schema
1. `profiles`: Extended user accounts with role-based access control (`customer`, `admin`, `dispatch_rider`).
2. `addresses`: Delivery addresses with coordinates, custom labels, instructions, and default address handling.
3. `categories`: Food categories (Soups, Rice, Seafood, Small Chops, Drinks).
4. `products`: Menu catalog with pricing in Kobo, preparation times, caloric values, ratings, and availability status.
5. `product_options` & `product_option_values`: Portions and swallow selections.
6. `chow_orders`: Orders table with statuses, delivery snapshots, fees in Kobo, and audit logs.
7. `order_items`: Line items with chosen options, quantities, and line totals in Kobo.
8. `dispatch_assignments`: Dispatch rider delivery assignment and live status progression.
9. `order_status_history`: Audit trail tracking every order status transition.

### RPC Functions
- `create_order_secure`: Server-side atomic order creation verifying available stock and computing authoritative price totals.
- `get_auth_role`: Security definer resolving the caller's role for RLS policy enforcement.
- `is_admin` & `is_rider`: Role verification helpers.

### Seed Data
Authentic South-South Nigerian catalog items seeded:
- *Calabar Afang Soup Special* (₦4,500)
- *Royalty Edikang Ikong* (₦4,800)
- *Rivers Fisherman Soup* (₦6,500)
- *Smoky Native Jollof Rice* (₦3,800)
- *Spicy Calabar Peppered Snails* (₦5,200)
- *Chilled Tapped Palm Wine* (₦1,500)

---

## 3. Environment Configuration
The `.env` file is configured in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://bdeoqfznozkruoqwovhf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZW9xZnpub3prcnVvcXdvdmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDQ4MTgsImV4cCI6MjEwNzMyMDgxOH0.RQpv9jaDUdZT4dUAXOseioUO1C7flOAb3zlljVwnuS8
```

---

## 4. How to Test the Integration

### A. Authentication
1. Open the Chow mobile app.
2. Tap the Profile tab -> Register or Sign In.
3. Enter email and password. Upon sign up, the account is created in Supabase Auth and synced with `public.profiles`.

### B. Place an Order
1. Browse dishes from the Home or Menu tabs.
2. Add items to the cart and navigate to **Checkout**.
3. Confirm delivery address and tap **Place Order**.
4. The app invokes `create_order_secure` on Supabase to generate the order in `public.chow_orders`.

### C. Live Realtime Updates
1. The app subscribes to status changes via Supabase Realtime postgres changes channel.
2. Any order status update in Supabase (e.g. `preparing`, `out_for_delivery`, `delivered`) updates the Order Tracking screen in real time.
