# ae-MBPK — Monochrome Flaticon Header + NomborNinja Dojo Upgrade

## Header icon fix
- Removed SVG fallback icons from the four title-bar controls. Each control now has one Flaticon image only.
- Applied grayscale/black filter in light mode and monochrome white filter in dark mode.
- Added explicit `[hidden]{display:none!important}` so inactive sun/moon images cannot display simultaneously.
- Adjusted flex sizing, spacing, and mobile dimensions to prevent icons from overlapping or layering.
- If an external Flaticon image fails to load, it is hidden rather than layered with a second icon. Flaticon images require internet access.

## NomborNinja upgrade
- Reworked the mascot into a black/red/gold ninja.
- Added a Dojo Nombor visual theme with dojo-inspired colors, subtle Japanese character motif, red mission accents, gold progress effects, dark-mode palette, and reduced-motion-safe animation.
- Updated Malay and English copy to use ninja mission language.
- Preserved existing question generation, scoring, hints, accessibility settings, and learning-session integration.

## Verification performed
- JavaScript syntax checks for edited inline scripts.
- Release static check.
- Static accessibility scan.
- Existing game-session unit tests.
- Existing learning-game static checks.

## Not verified
- Full Vite production build and visual rendering in the user's browser.
- Availability of external Flaticon CDN assets on all networks.
- Manual mobile, keyboard and screen-reader test.
