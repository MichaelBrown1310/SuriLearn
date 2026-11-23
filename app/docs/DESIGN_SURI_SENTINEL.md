---
name: Suri Sentinel
colors:
  surface: '#fff8f1'
  surface-dim: '#ebd8ae'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff2da'
  surface-container: '#ffecc2'
  surface-container-high: '#fae6bb'
  surface-container-highest: '#f4e1b6'
  on-surface: '#241a02'
  on-surface-variant: '#504537'
  inverse-surface: '#3a2f12'
  inverse-on-surface: '#ffefce'
  outline: '#827566'
  outline-variant: '#d4c4b2'
  surface-tint: '#835502'
  primary: '#835502'
  on-primary: '#ffffff'
  primary-container: '#e1a653'
  on-primary-container: '#5f3c00'
  inverse-primary: '#f9bb66'
  secondary: '#795746'
  on-secondary: '#ffffff'
  secondary-container: '#fed0ba'
  on-secondary-container: '#795746'
  tertiary: '#006875'
  on-tertiary: '#ffffff'
  tertiary-container: '#00c3d9'
  on-tertiary-container: '#004b55'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb4'
  primary-fixed-dim: '#f9bb66'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#633f00'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#e9bda8'
  on-secondary-fixed: '#2d1508'
  on-secondary-fixed-variant: '#5f4030'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#00daf3'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#fff8f1'
  on-background: '#241a02'
  surface-variant: '#f4e1b6'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system powers a gamified, mobile-first cybersecurity education experience fronted by Suri the Meerkat—a naturally vigilant, community-minded sentinel of the desert. The target audience spans Gen-Z learners, non-technical professionals, and everyday smartphone users who find traditional InfoSec concepts intimidating or dry. 

The aesthetic is clean, warm, and tactilely gamified: a 2D flat-vector illustration ethos inspired by leading educational platforms. It avoids sterile corporate enterprise tropes in favor of an approachable, sun-drenched savannah palette anchored by deep earth tones and high-tech cyber accents. The emotional goal is to turn vulnerability anxiety into playful vigilance, empowering users through tactile button presses, chunky modular reward cards, and crisp, unambiguous progression nodes.

## Colors

The palette balances warm savannah tones derived from the meerkat mascot with cybernetic digital cues:

- **Primary Brand / Core CTA (`#E1A653` - Warm Ocre Sand):** Used for primary interactive actions, high-energy lesson paths, and key progression milestones.
- **Secondary / Contrast & Structure (`#5F4030` - Deep Ash Brown):** Used for structural outlines, 3D button lip bevels, bold headings, and mascot-aligned framing.
- **Tertiary / Gem Currency & Tech Flare (`#00E5FF` - Cyber Cyan):** Reserved for virtual rewards, telemetry stats, streaks, and tech perks.
- **Neutral Surface / Canvas Backing (`#F6E3B8` - Soft Warm Beige):** Provides a soothing, organic background tone that prevents eye fatigue.
- **Pure Canvas & Crisp Cards (`#FFFFFF`):** High-contrast layer floating over the beige canvas for readable quiz modules and interactive cards.
- **Body Text (`#1C1917` - Pupil Dark):** Crisp, readable ink optimized for micro-copy and dense mobile question sets.
- **System Accents:** 
  - Sentinel Blue (`#2563EB`) for network protocols and core security topics.
  - Shield Green (`#22C55E`) for successful firewall deflections and correct answers.
  - Alert Red (`#EF4444`) for malicious phishing alerts, heart losses, and trap questions.

## Typography

The type system relies entirely on **Plus Jakarta Sans**, utilizing its geometric yet friendly terminal curves to echo the rounded anatomy of the meerkat mascot. 

All gamified metrics, XP, currency counts, and level milestones must use `label-lg` or `headline-md` at `800` (ExtraBold) weight with tabular numbers (`tnum`) to prevent visual jumping during increment animations. Body text maintains strict line heights to optimize scanning speed on compact 390px mobile screens. Uppercase styling is reserved strictly for `label-sm` badges (e.g., "THREAT DETECTED", "UNIT 01").

## Layout & Spacing

Designed primarily for mobile portrait screens (targeting baseline 390x844 px), the system operates on an 8pt modular rhythm using a 4-column fluid mobile grid with 16px margins and 16px gutters:

- **Vertical Pathway Rhythms:** Lesson tree nodes follow a sinusoidal zig-zag path, separated vertically by `space-xl` (32px) and horizontally staggered across a 3-lane column system (left, center, right).
- **HUD & Safe Areas:** The top status bar (hearts, streak, cyber-gems) has a fixed vertical height of 56px with `margin` (16px) horizontal padding. Bottom navigation is anchored with 64px height + device safe-area inset.
- **Card Padding:** Interactive modules and question containers maintain consistent `space-md` (16px) internal padding, expanding to `space-lg` (24px) on celebration modals and lesson completion podiums.

## Elevation & Depth

Rather than relying on diffused photorealistic drop-shadows, this design system adopts a **Tactile 2.5D Gamified Depth** model using solid color extrusions (lip bevels) and clean containment borders:

- **Interactive 3D Layering:** Buttons and active learning cards feature a bottom border lip (typically 4px solid in a darker shade of the element’s face). Upon active tap (`:active`), the element translates down by `3px`, reducing the lip height to `1px` to create an instantaneous physical press response.
  - Primary button (`#E1A653` surface) uses a `#B87B2E` bottom extrusion lip.
  - White surface cards use a 2px stroke of `#EAD2A8` and a 4px bottom lip of `#D5BD92`.
- **Modals & Drawers:** High-priority feedback dialogs (such as correct answer trays or threat warnings) slide up with a crisp `#5F4030` 20% opacity backdrop curtain, using a high z-index and 2px solid boundary borders without blur.

## Shapes

The shape language reflects the organic, friendly curves of Suri the Meerkat:

- **Base Radius (`0.5rem` / 8px):** Applied to badges, small tooltips, and secondary micro-chips.
- **Large Radius (`rounded-lg` / 16px):** Standard for quiz choice options, dialogue speech bubbles, and stat cards.
- **Extra-Large Radius (`rounded-xl` / 24px):** Used on hero unit banners, victory podiums, bottom sheets, and main lesson containers.
- **Full Pill (`rounded-full` / 9999px):** Applied to core interactive CTA buttons, heart/currency counters, and map navigation nodes.

## Components

### Primary & Action Buttons
- **Primary CTA:** Pill-shaped, `#E1A653` fill, white bold text, with a 4px bottom extrusion of `#B87B2E`. Minimum height is 52px for optimal thumb targeting.
- **Secondary (Hollow):** Pill-shaped, `#FFFFFF` fill with a 2px `#EAD2A8` border and a 3px `#EAD2A8` bottom lip. Text colored `#5F4030`.

### Gamified Pathway Nodes
- Circular 68x68px buttons with full-border containment.
- **Unlocked / Active:** Glowing `#E1A653` with Cyber Cyan ring accents and mascot state badge.
- **Completed:** Shield Green (`#22C55E`) with checkmark icon and solid green base extrusion.
- **Locked:** Stone beige muted state with `#D5BD92` icon fill and disabled interaction state.

### Quiz & Option Cards
- Crisp white (`#FFFFFF`) rounded-lg (16px) cards with 2px borders (`#EAD2A8`).
- Selected state turns the card border to Cyber Cyan (`#00E5FF`) with a tinted 5% cyan surface background.
- Error state snaps to Alert Red (`#EF4444`) with a quick 3-cycle horizontal shake transition.

### Mascot Dialogue & Feedback Drawers
- Chat bubbles feature a directional 8px triangular notch pointing toward Suri's rendered pose.
- Bottom sheet drawer for question validation:
  - **Success:** Shield Green tint background (`#DCFCE7`), deep green bold headline, containing Suri in an alert cheer pose.
  - **Failure:** Alert Red tint background (`#FEE2E2`), deep red text, showing Suri shielding his burrow with defensive safety tips.

### HUD & Counters
- Compact capsule containers with pill border-radius, `#FFFFFF` translucent or solid fills, containing inline iconography (Fire for Streaks, Heart for Lives, Cyan Gem for Cyber-Credits).