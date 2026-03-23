# Design System Master File — GrubEyes

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** GrubEyes
**Style:** Claymorphism (Soft 3D, toy-like, plasticine)
**Generated:** 2026-03-21
**Updated:** 2026-03-21 (aligned to actual implementation)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#DC2626` | `--color-primary` | Recipe titles, borders, shadows |
| Secondary | `#F87171` | `--color-secondary` | Bullets, light accents |
| CTA/Accent | `#CA8A04` | `--color-cta` | Section titles, loading states, FABs |
| Background | `#FFF7ED` | `--color-background` | App background (warm cream-orange) |
| Card BG | `#FFFFFF` | `--color-card` | Card surfaces |
| Text | `#450A0A` | `--color-text` | All body text |
| Border (warm) | `#FED7AA` | `--color-border-warm` | Card borders |
| Border (pink) | `#FECACA` | `--color-border-pink` | Header, badge, pill borders |
| Badge Yellow BG | `#FEF9C3` | `--color-badge-yellow` | Difficulty badges, camera FAB |
| Badge Pink BG | `#FEF2F2` | `--color-badge-pink` | Time badges, gallery FAB, pills |

**Color Notes:** Appetizing red + warm gold, with warm peach/orange borders for clay depth.

### Typography

- **Heading Font:** Playfair Display SC
- **Body Font:** Karla
- **Mood:** culinary, warm, playful, toy-like, premium
- **Google Fonts:** [Playfair Display SC + Karla](https://fonts.google.com/share?selection.family=Karla:wght@300;400;500;600;700|Playfair+Display+SC:wght@400;700)

### Claymorphism Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width` | `4px` | Cards, FABs, headers, buttons |
| `--border-width-sm` | `3px` | Badges, pills, step numbers, bullets |
| `--radius-card` | `24px` | Cards, buttons |
| `--radius-badge` | `14px` | Meta badges |
| `--radius-header` | `28px` | Header bottom corners |
| `--radius-fab` | `24px` | Floating action buttons |
| `--radius-step` | `12px` | Step number containers |

### Animations (Claymorphism Bounce)

All interactive elements use `ClayPressable` (`components/ClayPressable.tsx`):

| Phase | Transform | Spring Config |
|-------|-----------|---------------|
| Press In | `scale: 0.96` | `speed: 50, bounciness: 0` (fast squish) |
| Press Out | `scale: 1.0` | `speed: 12, bounciness: 14` (bouncy overshoot) |

Uses `useNativeDriver: true` for 60fps on the UI thread.

### Shadow System (Claymorphism)

All shadows use `shadowRadius: 0` (no blur) for the signature "pressed clay" 3D depth effect.

| Level | shadowColor | Offset | Opacity | Usage |
|-------|------------|--------|---------|-------|
| Card | `#C2410C` | `0, 6` | `0.18` | Recipe cards, content cards |
| Header | `#DC2626` | `0, 6` | `0.15` | Top header bar |
| FAB | `#92400E` | `0, 6` | `0.35` | Floating action buttons |
| Pill | `#DC2626` | `0, 4` | `0.08` | Ingredient pills |
| Button | `#DC2626` | `0, 5` | `0.12` | Refresh button |
| Step | `#DC2626` | `0, 3` | `0.10` | Step number circles |
| Back | `#DC2626` | `0, 4` | `0.12` | Back button |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `20-24px` | Section/scroll padding |
| `--space-xl` | `32px` | Large gaps |

---

## Component Specs (React Native)

### Cards

```javascript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 22,
  borderWidth: 4,
  borderColor: '#FED7AA',
  shadowColor: '#C2410C',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 0,     // KEY: no blur = clay depth
  elevation: 6,
}
```

### FABs

```javascript
{
  width: 72,
  height: 72,
  borderRadius: 24,
  borderWidth: 4,
  borderColor: '#FEF9C3',
  shadowColor: '#92400E',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 0,
  elevation: 8,
  overflow: 'hidden',   // Crops square images into rounded badges
}
```

### Badges

```javascript
{
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 14,
  fontFamily: 'Karla',
  fontWeight: '700',
  fontSize: 14,
  borderWidth: 3,
}
```

---

## Anti-Patterns (Do NOT Use)

- ❌ **Blurred shadows** — Always use `shadowRadius: 0` for claymorphism
- ❌ **Thin borders (1-2px)** — Minimum `3px`, prefer `4px`
- ❌ **Small border-radius (<14px)** — Claymorphism needs chunky rounding
- ❌ **Cold/grey backgrounds** — Use warm pastels (`#FFF7ED`, `#FEF2F2`)
- ❌ **Emojis as icons** — Use SVG icons (Lucide) or custom 3D clay assets
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Flat cards without borders** — Every card needs a visible thick border

---

## Pre-Delivery Checklist

- [ ] All cards have `borderWidth: 4` + `shadowRadius: 0`
- [ ] All icons from Lucide or custom 3D clay assets
- [ ] Background is `#FFF7ED` (warm cream), never white or grey
- [ ] Text contrast 4.5:1 minimum
- [ ] No horizontal scroll on mobile
- [ ] Font families: Playfair Display SC (headings), Karla (body)
