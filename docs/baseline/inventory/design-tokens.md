# Design tokens (src/brand.css)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


9 `:root`/`[data-theme]` blocks. Named themes: `strategic` (TE-THM-strategic), `glow-light` (TE-THM-glow-light), `glow-dark` (TE-THM-glow-dark), `momentum-warm` (TE-THM-momentum-warm), `lagoon` (TE-THM-lagoon), `prospect` (TE-THM-prospect).

Responsive breakpoints used (`@media` condition → occurrences): `max-width: 600px`×8, `max-width: 700px`×7, `max-width: 900px`×5, `prefers-reduced-motion: reduce`×4, `max-width: 720px`×3, `max-width: 760px`×3, `max-width: 768px`×2, `max-width: 960px`×2, `max-width: 860px`×2, `max-width: 480px`×1, `max-width: 1050px`×1, `max-width: 560px`×1, `max-width: 520px`×1, `max-width: 1024px`×1.

## `:root` — `src/brand.css:3`

| Token | Value |
|---|---|
| `--sb-navy` | `#1B2A3B` |
| `--sb-navy-deep` | `#111928` |
| `--sb-navy-soft` | `#2D3A4E` |
| `--sb-cream` | `#F5F0E8` |
| `--sb-ivory` | `#FBF6F0` |
| `--sb-linen` | `#F0E4D4` |
| `--sb-gold` | `#C4843A` |
| `--sb-gold-warm` | `#a86d3a` |
| `--sb-teal` | `#4A7C8E` |
| `--sb-teal-deep` | `#4A6670` |
| `--sb-sage` | `#B5C4C1` |
| `--sb-taupe` | `#D4B896` |
| `--sb-dusty` | `#8B9BAE` |
| `--sb-plum` | `#7A6E8E` |
| `--sb-green` | `#A8B89A` |
| `--sb-greige` | `#8A8072` |
| `--sb-champagne` | `#E8DCC4` |
| `--sb-risk-critical` | `#C44A4A` |
| `--sb-risk-high` | `#C4843A` |
| `--sb-risk-low` | `#A8B89A` |
| `--sb-font-display` | `'Cormorant Garamond', Georgia, serif` |
| `--sb-font-label` | `'Jost', system-ui, sans-serif` |
| `--sb-font-body` | `'DM Sans', system-ui, sans-serif` |
| `--sb-radius` | `2px` |
| `--sb-border` | `0.5px` |
| `--sb-navy-100` | `#DDE4EA` |
| `--sb-navy-300` | `#7E93A6` |
| `--sb-navy-500` | `#1B2A3B` |
| `--sb-navy-700` | `#101B27` |
| `--sb-navy-900` | `#0A121C` |
| `--sb-gold-100` | `#F5E3C4` |
| `--sb-gold-300` | `#DDAA66` |
| `--sb-gold-500` | `#C4843A` |
| `--sb-gold-700` | `#9C6329` |
| `--sb-gold-900` | `#6E461D` |
| `--sb-teal-100` | `#DCE8E7` |
| `--sb-teal-300` | `#8FADB6` |
| `--sb-teal-500` | `#4A7C8E` |
| `--sb-teal-700` | `#355C6A` |
| `--sb-teal-900` | `#223E48` |
| `--sb-neutral-100` | `#FBF9F5` |
| `--sb-neutral-300` | `#EFEAE0` |
| `--sb-neutral-500` | `#D4CBBB` |
| `--sb-neutral-700` | `#8B8272` |
| `--sb-neutral-900` | `#3A352C` |
| `--sb-pink-100` | `#F5DCE3` |
| `--sb-pink-300` | `#E8A9BC` |
| `--sb-pink-500` | `#E8407A` |
| `--sb-pink-700` | `#B0305D` |
| `--sb-pink-900` | `#781F3D` |
| `--sb-airy-white` | `#FAFAF9` |
| `--sb-airy-cloud` | `#F0EFEC` |
| `--sb-airy-linen` | `#E5E3DE` |
| `--sb-airy-stone` | `#CFCCC3` |
| `--sb-theme-bg` | `var(--sb-navy)` |
| `--sb-theme-surface` | `var(--sb-navy-soft)` |
| `--sb-theme-text` | `var(--sb-cream)` |
| `--sb-theme-text-soft` | `var(--sb-sage)` |
| `--sb-theme-primary` | `var(--sb-gold)` |
| `--sb-theme-secondary` | `var(--sb-teal)` |
| `--sb-theme-pink` | `var(--sb-pink-500)` |
| `--sbh-cream` | `#F8F4EC` |
| `--sbh-parchment` | `#DAD3CE` |
| `--sbh-parchment-deep` | `#C9D9DB` |
| `--sbh-ink` | `#2B2A28` |
| `--sbh-ink-soft` | `rgba(43,42,40,0.66)` |
| `--sbh-teal` | `#4A7C8E` |
| `--sbh-teal-deep` | `#345A68` |
| `--sbh-gold` | `#C4843A` |
| `--sbh-pink` | `#D98CA0` |
| `--sbh-mauve` | `#785D69` |
| `--sbh-champagne` | `#FFF2DD` |
| `--sbh-muted` | `#746C61` |
| `--sbh-line` | `rgba(43,42,40,0.12)` |
| `--sbh-font-display` | `'Fraunces', 'Cormorant Garamond', Georgia, serif` |
| `--sbh-font-mono` | `'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace` |

## `[data-theme="strategic"]` — `src/brand.css:111`

| Token | Value |
|---|---|
| `--sb-navy` | `#1B2A3B` |
| `--sb-navy-deep` | `#111928` |
| `--sb-navy-soft` | `#2D3A4E` |
| `--sb-cream` | `#F5F0E8` |
| `--sb-ivory` | `#FBF6F0` |
| `--sb-linen` | `#F0E4D4` |
| `--sb-gold` | `#C4843A` |
| `--sb-gold-warm` | `#A86D3A` |
| `--sb-teal` | `#4A7C8E` |
| `--sb-teal-deep` | `#4A6670` |
| `--sb-sage` | `#B5C4C1` |
| `--sb-taupe` | `#D4B896` |
| `--sb-dusty` | `#8B9BAE` |
| `--sb-theme-bg` | `var(--sb-navy)` |
| `--sb-theme-surface` | `var(--sb-navy-soft)` |
| `--sb-theme-text` | `var(--sb-cream)` |
| `--sb-theme-text-soft` | `var(--sb-sage)` |
| `--sb-theme-primary` | `var(--sb-gold)` |
| `--sb-theme-secondary` | `var(--sb-teal)` |
| `--sb-theme-pink` | `var(--sb-pink-500)` |

## `[data-theme="glow-light"]` — `src/brand.css:125`

| Token | Value |
|---|---|
| `--sb-navy` | `#2C3E52` |
| `--sb-navy-deep` | `#182530` |
| `--sb-navy-soft` | `#4E6377` |
| `--sb-cream` | `#FAFAF9` |
| `--sb-ivory` | `#FAFAF9` |
| `--sb-linen` | `#F0EFEC` |
| `--sb-gold` | `#9C6329` |
| `--sb-gold-warm` | `#7A4E1F` |
| `--sb-teal` | `#355C6A` |
| `--sb-teal-deep` | `#24404A` |
| `--sb-sage` | `#C7D3DA` |
| `--sb-taupe` | `#DEDBD3` |
| `--sb-dusty` | `#8FA3B3` |
| `--sb-theme-bg` | `var(--sb-airy-white)` |
| `--sb-theme-surface` | `var(--sb-airy-cloud)` |
| `--sb-theme-text` | `var(--sb-navy-500)` |
| `--sb-theme-text-soft` | `var(--sb-navy-300)` |
| `--sb-theme-primary` | `var(--sb-gold-700)` |
| `--sb-theme-secondary` | `var(--sb-teal-700)` |
| `--sb-theme-pink` | `var(--sb-pink-500)` |

## `[data-theme="glow-dark"]` — `src/brand.css:139`

| Token | Value |
|---|---|
| `--sb-navy` | `#0A121C` |
| `--sb-navy-deep` | `#050A10` |
| `--sb-navy-soft` | `#182530` |
| `--sb-cream` | `#FAFAF9` |
| `--sb-ivory` | `#F0EFEC` |
| `--sb-linen` | `#E5E3DE` |
| `--sb-gold` | `#DDAA66` |
| `--sb-gold-warm` | `#C4843A` |
| `--sb-teal` | `#8FADB6` |
| `--sb-teal-deep` | `#4A7C8E` |
| `--sb-sage` | `#B8C4CC` |
| `--sb-taupe` | `#4A3E36` |
| `--sb-dusty` | `#8FA3B3` |
| `--sb-theme-bg` | `var(--sb-navy-900)` |
| `--sb-theme-surface` | `var(--sb-navy-700)` |
| `--sb-theme-text` | `var(--sb-airy-white)` |
| `--sb-theme-text-soft` | `var(--sb-navy-300)` |
| `--sb-theme-primary` | `var(--sb-gold-300)` |
| `--sb-theme-secondary` | `var(--sb-teal-300)` |
| `--sb-theme-pink` | `var(--sb-pink-300)` |

## `[data-theme="momentum-warm"]` — `src/brand.css:153`

| Token | Value |
|---|---|
| `--sb-navy` | `#1B2A3B` |
| `--sb-navy-deep` | `#111928` |
| `--sb-navy-soft` | `#2D3A4E` |
| `--sb-cream` | `#FAFAF9` |
| `--sb-ivory` | `#F5E3C4` |
| `--sb-linen` | `#F0EFEC` |
| `--sb-gold` | `#9C6329` |
| `--sb-gold-warm` | `#6E461D` |
| `--sb-teal` | `#587B7B` |
| `--sb-teal-deep` | `#3B5757` |
| `--sb-sage` | `#D9C9A8` |
| `--sb-taupe` | `#C9A171` |
| `--sb-dusty` | `#8B9BAE` |
| `--sb-theme-bg` | `var(--sb-gold-100)` |
| `--sb-theme-surface` | `var(--sb-neutral-100)` |
| `--sb-theme-text` | `var(--sb-navy-700)` |
| `--sb-theme-text-soft` | `var(--sb-neutral-700)` |
| `--sb-theme-primary` | `var(--sb-navy-500)` |
| `--sb-theme-secondary` | `var(--sb-gold-700)` |
| `--sb-theme-pink` | `var(--sb-pink-500)` |

## `[data-theme="lagoon"]` — `src/brand.css:167`

| Token | Value |
|---|---|
| `--sb-navy` | `#1B2A3B` |
| `--sb-navy-deep` | `#0F1E24` |
| `--sb-navy-soft` | `#22404A` |
| `--sb-cream` | `#FAFAF9` |
| `--sb-ivory` | `#EAF2F1` |
| `--sb-linen` | `#DCE8E7` |
| `--sb-gold` | `#DDAA66` |
| `--sb-gold-warm` | `#B87538` |
| `--sb-teal` | `#7FA0A0` |
| `--sb-teal-deep` | `#4A6670` |
| `--sb-sage` | `#A9C4C2` |
| `--sb-taupe` | `#6B92A0` |
| `--sb-dusty` | `#7E93A6` |
| `--sb-theme-bg` | `var(--sb-teal-900)` |
| `--sb-theme-surface` | `var(--sb-teal-700)` |
| `--sb-theme-text` | `var(--sb-airy-white)` |
| `--sb-theme-text-soft` | `var(--sb-teal-100)` |
| `--sb-theme-primary` | `var(--sb-gold-300)` |
| `--sb-theme-secondary` | `var(--sb-navy-300)` |
| `--sb-theme-pink` | `var(--sb-pink-300)` |

## `[data-theme="prospect"]` — `src/brand.css:187`

| Token | Value |
|---|---|
| `--sb-navy` | `#345A68` |
| `--sb-navy-deep` | `#24404A` |
| `--sb-navy-soft` | `#4A7C8E` |
| `--sb-cream` | `#F8F4EC` |
| `--sb-ivory` | `#FFFDF8` |
| `--sb-linen` | `#F1EBDD` |
| `--sb-gold` | `#C4843A` |
| `--sb-gold-warm` | `#9C6329` |
| `--sb-teal` | `#4A7C8E` |
| `--sb-teal-deep` | `#345A68` |
| `--sb-sage` | `#C7C2B8` |
| `--sb-taupe` | `#DEDBD3` |
| `--sb-dusty` | `#8B9BAE` |
| `--sb-theme-bg` | `#F8F4EC` |
| `--sb-theme-surface` | `#FFFDF8` |
| `--sb-theme-text` | `#2B2A28` |
| `--sb-theme-text-soft` | `#625E59` |
| `--sb-theme-primary` | `var(--sb-gold)` |
| `--sb-theme-secondary` | `var(--sb-teal)` |
| `--sb-theme-pink` | `var(--sb-pink-500)` |

## `:root` — `src/brand.css:218`

| Token | Value |
|---|---|
| `--sb-admin-bg` | `#F8F4EC` |
| `--sb-admin-surface` | `#F1EBDD` |
| `--sb-admin-surface-deep` | `#ECE3D0` |
| `--sb-admin-surface-alt` | `#FFFDF8` |
| `--sb-admin-text` | `#2B2A28` |
| `--sb-admin-text-soft` | `rgba(43,42,40,0.65)` |
| `--sb-admin-border` | `rgba(43,42,40,0.12)` |
| `--sb-admin-border-strong` | `rgba(43,42,40,0.22)` |
| `--sb-admin-gold` | `#C4843A` |
| `--sb-admin-gold-warm` | `#9C6329` |
| `--sb-admin-gold-tint` | `rgba(196,132,58,0.12)` |
| `--sb-admin-teal` | `#4A7C8E` |
| `--sb-admin-teal-deep` | `#345A68` |
| `--sb-admin-teal-tint` | `#DCE9EC` |
| `--sb-admin-pink` | `#D98CA0` |
| `--sb-admin-danger` | `#B25252` |
| `--sb-admin-success` | `#4E8A63` |

## `:root` — `src/brand.css:306`

| Token | Value |
|---|---|
| `--sb-shape-on-dark` | `color-mix(in srgb, var(--sb-gold) 24%, var(--sb-navy) 76%)` |
| `--sb-shape-on-light` | `color-mix(in srgb, var(--sb-navy) 10%, var(--sb-ivory) 90%)` |
