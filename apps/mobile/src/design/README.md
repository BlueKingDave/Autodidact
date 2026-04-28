# design/

Single source of truth for all visual values. Nothing outside this folder
defines colors, spacing, or type sizes. `src/constants/colors.ts` is deleted
as part of this migration.

## Dependency chain

tokens → themes → typography → config

Each layer depends only on the one before it. Never import config.ts from
tokens, themes, or typography — that would create a circular dependency.

## tokens.ts

Primitive scales: raw hex values, spacing steps, border radius, icon sizes.
No semantic meaning. If you need a new color in the app, it starts here.

## themes.ts

Semantic mapping. Names a subset of token values by intent: bg, surface,
surfaceHover, text, textMuted, border, primary, primaryHover, success,
warning, danger, overlay. Screens and components reference these names,
never raw tokens. Adding a light theme = add one new object here.

## typography.ts

Font system. System font family + named type scale: xs, sm, md, lg, xl, h2, h1.
Also exports `typescale` which maps those names to Tamagui's numeric font keys.

## config.ts

Single call to `createTamagui`. Exported and consumed only by `TamaguiProvider`
in `app/_layout.tsx`. Nothing else should call `createTamagui`.
