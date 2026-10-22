# ae-MBPK — Learning Centre WOW Upgrade

## What's changed

### Learner dashboard
- Redesigned the dashboard with a calmer, more polished visual system, responsive cards, clearer hierarchy and subtle, reduced-motion-aware animation.
- Added a date-based daily activity suggestion that launches an existing game.
- Replaced hard-coded learner progress values with counts calculated from local completed sessions.
- Added recent activity, four learning pathways, a personalised greeting and a gentle five-session target that is explicitly not a mastery measure.

### Interactive discovery
- Added a global quick-search palette (top-bar search and Ctrl/Cmd+K) for sections and games.
- Added a mobile “More” menu so insights, rewards, accessibility settings and Teacher Studio remain reachable on smaller screens.
- Added game search, skill filters and persistent favourites.
- Added working learning-module links to Braille, MySL communication-intent practice and the visual AAC board.
- Replaced placeholder insight dialogs with concise, non-diagnostic educational summaries, practical support ideas and a clear review disclaimer.

### Rewards and privacy
- Replaced static sample badges with achievements derived from sessions and activities actually recorded on the current browser.
- Added a local-only progress summary and a clear action that resets the learning-centre summary/favourites/badges without deleting game-specific saves.
- Added progress tracking to the shared game runtime, Braille quiz, Misi Berdikari and AAC board exploration. Stored summaries omit raw answers and do not sync to a server.
- Kept Teacher Studio's example analytics clearly labelled as demonstration data and added a direct link to the real Teacher Portal.

### Accessibility
- Retained dark mode, larger text, reduced motion, high contrast, language selection and audio preference controls.
- Added visible focus states, accessible labels, live result counts, modal focus restoration and keyboard focus trapping.
- Maintained no-required-timer messaging and supportive language around hints and mistakes.
- The top-bar icon controls remain single-image, monochrome Flaticon assets; they do not stack with SVG fallbacks.

## Data and product boundaries
- Learning-centre summary data is stored in `localStorage` on the current browser/device only.
- Cloud game-session records remain subject to the existing verified Teacher Portal/Supabase flow and its RLS policies.
- Teacher Studio analytics and its CSV export are still demonstration data; use `/account.html` for the actual teacher portal.
- MySL content does not invent hand shapes. The activity practises communication intent and continues to state that authentic signs require review by a competent MySL instructor/community.
- Insight content is general education, not diagnosis or an intervention plan.

## Checks
- `npm run check:release`
- `npm run check:a11y:static`
- `npm run check:games`
- `npm run check:added-games`
- `npm run check:progress`
- `npm run check:ui`
- `node test-game-session.mjs`

The static checks and Node tests passed during this package preparation. `npm install` did not finish in the build environment, so a Vite production build and visual browser/device testing could not be verified here. Before deployment, run `npm install`, `npm run build`, `npm run preview`, then test keyboard navigation, screen-reader announcements, responsive layouts and the configured Supabase project.
