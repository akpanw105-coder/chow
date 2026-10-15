---
name: Calabar Kitchen Contemporary Food Experience
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e1'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fb'
  surface-container: '#efecf5'
  surface-container-high: '#eae7ef'
  surface-container-highest: '#e4e1ea'
  on-surface: '#1b1b21'
  on-surface-variant: '#5c403c'
  inverse-surface: '#303036'
  inverse-on-surface: '#f2eff8'
  outline: '#906f6b'
  outline-variant: '#e5bdb8'
  surface-tint: '#bc1415'
  primary: '#b81012'
  on-primary: '#ffffff'
  primary-container: '#dd3028'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4aa'
  secondary: '#72594e'
  on-secondary: '#ffffff'
  secondary-container: '#fedbcd'
  on-secondary-container: '#785f54'
  tertiary: '#b41d19'
  on-tertiary: '#ffffff'
  tertiary-container: '#d8382e'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#fedbcd'
  secondary-fixed-dim: '#e0c0b2'
  on-secondary-fixed: '#29170f'
  on-secondary-fixed-variant: '#594238'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930007'
  background: '#fbf8ff'
  on-background: '#1b1b21'
  surface-variant: '#e4e1ea'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  price-display:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a warm, appetizing, and premium culinary delivery experience tailored for upscale contemporary Nigerian dining, with a focus on rich South-South and regional dishes (such as Bole & Grilled Fish, Afang Soup, Edikang Ikong, and Fisherman's Soup). 

The emotional tone balances high-end culinary indulgence with effortless, breezy mobile convenience. The visual language blends soft-touch minimalism with tactile product elevation: pure white surface containers floating over a warm, barely-there canvas; vibrant coral accents stimulating appetite and guiding key transactional paths; and generous, friendly rounded corners (24px to 32px) creating an inviting, modern handheld feel.

## Colors

The palette is engineered around vibrant culinary energy and soft organic warmth:

- **Primary (`#FF493D`):** Energetic fiery coral red. Used strictly for core call-to-action buttons, key status badges, quantity plus-counters, and prominent active navigation states.
- **Primary Hover / Active (`#E03E33`):** Pressed state tone for primary touchpoints.
- **Secondary (`#F8D6C8` / `#FFF2EE`):** Soft warm peach tint. Used as container fill for secondary tags, subtle pill selection backgrounds, badge backdrops, and active toggle chips.
- **Neutral Charcoal (`#1E1E24` / `#111827`):** Deep, legible tone for major headings, food titles, and bold price figures.
- **Muted Neutral (`#6B7280` / `#9CA3AF`):** Balanced mid-grey for descriptions, preparation metadata (cook time, calories), inactive tab icons, and subtitle microcopy.
- **Canvas (`#FAFAFA` / `#F8F9FA`):** Warm, soft off-white canvas that ensures pure white cards pop without harsh contrast.
- **Surface (`#FFFFFF`):** Crisp pure white card tiles, modal sheets, and floating bars.
- **Currency formatting:** Always displayed with the Nigerian Naira symbol (`₦`) alongside the charcoal bold font weight (e.g., `₦7,500`).

## Typography

The typography uses Inter to deliver clean, crisp Swiss-grotesque readability reminiscent of Apple HIG / SF Pro. 

Headings feature tight tracking (`-0.01em` to `-0.02em`) and strong weights (`600` and `700`) to anchor dishes like *Afang Soup & Pounded Yam* or *Crispy Bole & Peppered Fish*. Body copy maintains generous line heights for clear ingredient reads. Numeric representations—especially Naira pricing (`price-display`) and stepper counters—use tabular numeric alignments where applicable to avoid layout jitter during quantity adjustments.

## Elevation & Depth

Visual hierarchy is built via soft ambient lighting over pure white surfaces:

- **Level 0 (Canvas Base):** Tinted warm off-white (`#F8F9FA`) background layer.
- **Level 1 (Card Surfaces):** Pure white cards (`#FFFFFF`) cast an ultra-soft, diffused drop shadow: `0 8px 24px -4px rgba(30, 30, 36, 0.04), 0 2px 6px -1px rgba(30, 30, 36, 0.02)`.
- **Level 2 (Floating Controls & Navigation):** Elevated circular icon buttons and bottom navigation bars utilize `0 12px 32px -4px rgba(30, 30, 36, 0.08)`.
- **Level 3 (Action Accent Glow):** Primary checkout pills and active steppers receive a subtle coral reflection: `0 8px 20px 0 rgba(255, 73, 61, 0.28)`.
- **Separators:** Ruled divider lines are replaced with negative space or ultra-faint borders (`rgba(0, 0, 0, 0.03)`).

## Shapes

The design system embraces an ultra-soft, pill-shaped aesthetic reflecting the friendly curves of contemporary mobile food ordering:

- **Full Pills (`rounded-full` / `9999px`):** Primary action buttons, increment/decrement steppers, search fields, size/portion selectors, and filter chips.
- **Large Cards (`rounded-2xl` / `24px` to `32px`):** Featured dish hero containers, cart item cards, and checkout sheets.
- **Circular Touchpoints (`50%`):** Top app bar icon buttons (back button, cart indicator, meatball menu), rating tags, and stepper counters.

## Components

### Buttons
- **Primary CTA:** Pill-shaped, full-height (52px–56px), filled with coral red (`#FF493D`), white bold text, accompanied by an optional right-aligned shopping bag or arrow icon. Ambient shadow with coral tint.
- **Circular Icon Buttons:** 44px × 44px pure white circles with soft drop shadows, housing clean 1.5px stroke dark charcoal icons (e.g., Back chevron, More options, Favorite heart).
- **Cart Add Floating Pill:** Overlayed directly onto dish cards; includes a black cart icon badge joined to a coral "Add to Cart" button.

### Quantity Stepper
- Distinctive segmented pill with a white or muted background containing:
  - Grey minus icon (`-`).
  - Dark charcoal numeric value.
  - Vibrantly filled coral circle with a white plus icon (`+`).

### Food Cards & Lists
- **Hero Featured Card:** Full-bleed food photography masked inside a 28px rounded surface. Features floating price tags in the top-left (pill badge in warm sand or charcoal) and a circular favorite button in the top-right.
- **Horizontal Cart Item:** Pure white card with 24px radius containing an 80px × 80px rounded dish thumbnail on the left, two lines of item details and pricing (`₦`) in the center, and vertical alignment for steppers and more-option actions.

### Selection Chips & Filters
- Compact pill-shaped chips (36px height) with light borders (`#E5E7EB`) or peach fill (`#FFF2EE`) when selected. Icons accompany filter labels (e.g., Delivery Time, Rating, Price).

### Inputs & Search
- Full pill container with warm grey fill (`#F3F4F6` or `#FFFFFF` with ambient shadow). Includes a clean search icon prefix, subtle placeholder text ("Search Bole, Soups, Grills..."), and an elevated circular filter button at the far right.