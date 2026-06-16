## Letters to Strangers — Implementation Plan

A warm, intimate letter-exchange feature where users write anonymous letters that get delivered to one stranger who needs encouragement.

### 1. Database (migration)

New table `public.letters`:
- `author_id` (uuid, ref auth.users)
- `opening` (text, default "Dear Stranger,")
- `body` (text, required, ≥30 words server-side validated via trigger)
- `closing` (text, nullable)
- `word_count` (int)
- `status` (text: `available` | `delivered` | `held_for_review` | `removed`)
- `delivered_to` (uuid, nullable — enforces one-recipient rule)
- `delivered_at` (timestamptz, nullable)
- `flagged_keywords` (text[], nullable)
- `created_at`, `updated_at`

New table `public.saved_letters`:
- `user_id`, `letter_id` (composite unique)
- `saved_at`

RPC `public.claim_random_letter()` (SECURITY DEFINER):
- Atomically picks a random `available` letter not authored by caller, sets `status='delivered'`, `delivered_to=auth.uid()`, returns the row. Returns null if none.

GRANTs + RLS:
- `letters`: authors can SELECT/INSERT own; recipients can SELECT where `delivered_to = auth.uid()`; admins all. No anon.
- `saved_letters`: users manage own rows only.

Crisis-keyword detection runs client-side using existing `containsCrisisLanguage` from `src/lib/crisisDetection.ts` — if matched, insert with `status='held_for_review'`.

### 2. Routing & Navigation

- New route `/letters` in `src/App.tsx` → `src/pages/Letters.tsx`.
- Add "Letters" link with 💌 icon to `src/components/layout/Navbar.tsx` desktop + mobile menus.
- Add Letters tab to `src/components/layout/MobileBottomNav.tsx` if it has nav items (will check).

### 3. Page structure (`src/pages/Letters.tsx`)

Tabs: **Home** | **Write** | **My Letters**

**Home tab** (landing):
- Hero with cream/lavender gradient, gentle copy: "Write a letter for a stranger who needs it. Request one when you do."
- Two large cards: "Write a Letter" and "I need a letter".

**Write flow** (`LetterComposer` component):
- Full-screen letter-paper styling: cream bg, lined texture via repeating-linear-gradient, handwriting font (Caveat or Kalam via Google Fonts in `index.html`).
- Fields: opening (pre-filled "Dear Stranger,"), body textarea (live word count, encouragement at 50), optional closing.
- Side tip card: "Some ideas — write about something that helped you through a hard time…"
- "Seal & Send" — disabled until ≥30 words. Runs crisis check, inserts letter, shows confirmation: "Your letter has been sealed 💌 Someone out there will read this when they need it most."

**Receive flow** (`LetterReceiver` component):
- "I need a letter" → loading state "Finding a letter just for you..." (1.5s)
- Calls `claim_random_letter` RPC.
- If null → empty-state card: "The mailbox is quiet right now — but you could be the first to leave something for someone else." + Write CTA.
- Else → envelope-opening animation (CSS keyframes: flap rotates open, letter slides up) → letter on cream paper.
- Footer: heart button (save → `saved_letters`), "Write one back to the world" button → switch to Write tab.

**My Letters tab**:
- Sub-tabs: "Written" (count + list of sent letters with date + status badge) and "Received" (saved letters only, full content, with date saved).

### 4. Design tokens

Add to `src/index.css`:
- `--letter-cream: 40 38% 95%`
- `--letter-lavender: 270 40% 92%`
- `--letter-ink: 230 30% 25%`
- `--gradient-letter: linear-gradient(135deg, hsl(var(--letter-cream)), hsl(var(--letter-lavender)))`
- Lined-paper background utility class.

Add Google Fonts `Caveat` and `Kalam` to `index.html`; expose as `font-handwriting` in `tailwind.config.ts`.

### 5. Safety

- Crisis keywords use existing `CRISIS_KEYWORDS` from `src/lib/crisisDetection.ts`.
- Server-side trigger on `letters` recomputes `word_count` and sets `status='held_for_review'` if `body` contains a crisis term (using the same word list, encoded in SQL).
- Letters held for review surface in admin Reports later (not in scope now beyond the status flag).

### 6. Files

- New: `src/pages/Letters.tsx`, `src/components/letters/LetterComposer.tsx`, `src/components/letters/LetterReceiver.tsx`, `src/components/letters/MyLetters.tsx`, `src/components/letters/EnvelopeAnimation.tsx`.
- Edited: `src/App.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/MobileBottomNav.tsx` (if applicable), `src/index.css`, `tailwind.config.ts`, `index.html`.
- Migration: new `letters` + `saved_letters` tables, RLS, GRANTs, claim RPC, validation trigger.

### Notes / scope

- Requires login (uses `auth.uid()` throughout). I'll redirect unauthenticated visitors to `/auth`.
- "Push notifications later" — out of scope here.
- No moderation queue UI in this pass; held letters just don't enter the pool. We can add an admin review tab next.
