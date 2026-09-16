# Kanak Parakh Foundation — Participant Directory

An internal directory app for the foundation's community: who the participants
are, what they're good at, how much time they have, and what they're working on.

React + TypeScript + Vite on the front, **Firebase Data Connect** (PostgreSQL on
Cloud SQL) behind it.

---

## Running it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173.

The app runs entirely on seed data right now — **no Firebase credentials
needed** to develop or demo it. All 48 participants, the projects and the
resources come from `src/data/mock.ts`, and every dashboard figure is computed
from those records rather than hardcoded.

Other commands:

```bash
npm run build     # type-check + production bundle into dist/
npm run preview   # serve the production build locally
```

---

## What's built

| Screen | Route | Notes |
|---|---|---|
| Dashboard | `/` | Four computed stat cards, recent participants |
| People Directory | `/people` | Full table, search, four-way filter panel |
| Participant detail | `/people/:id` | Contact, expertise, availability, about |
| Add Participant | `/people/new` | Three-step wizard with per-step validation |
| My Profile | `/profile` | Same layout, editable in place |
| Projects / Teams | `/projects` | Project cards with team avatars and leads |
| Resources | `/resources` | Shared library, filterable by category |
| Settings | `/settings` | Account links; doubles as mobile "More" |

Every screen has a phone layout. The directory table becomes a stacked list
below 860px, and the sidebar is replaced by a bottom tab bar.

---

## Project structure

```
src/
  styles/
    tokens.css        every colour, font and spacing value — change here only
    global.css        component styles + responsive rules
  components/
    Layout.tsx        sidebar, mobile top bar, bottom tab bar, TopBar
    PeopleTable.tsx   the table (desktop) and stacked list (mobile)
    ui.tsx            Avatar, StatusPill, Tag, Field, Select, Stepper
    icons.tsx         inline SVG icon set
  data/
    mock.ts           seed data
    api.ts            THE SEAM — swap this for generated hooks (see below)
  pages/              one file per screen
  lib/firebase.ts     Firebase init, reads .env.local
dataconnect/
  schema/schema.gql       Postgres tables
  connector/queries.gql   read operations
  connector/mutations.gql write operations
```

No component imports `mock.ts` directly. Everything goes through
`src/data/api.ts`, which is the only file that has to change when the database
goes live.

---

## The database

Eight tables, all relational:

- **participants** — the person record
- **expertise_areas** — a controlled skill vocabulary, not free text
- **participant_expertise** — many-to-many join
- **projects** / **project_members** — many-to-many join
- **hours_logs** — hours actually worked, what the dashboard sums
- **resources**, **notifications**

The two join tables are the reason this is SQL and not a document store: the
Search & Filter screen combines *expertise AND availability AND location AND
status* in one query, and expertise is many-per-person. In Postgres that's a
single `WHERE` across a join.

### Going live

1. **Create the backend.** From the project root:
   ```bash
   firebase login
   firebase init dataconnect
   ```
   This provisions a Cloud SQL Postgres instance. Update `instanceId` and
   `location` in `dataconnect/dataconnect.yaml` to match what it creates.

2. **Push the schema.**
   ```bash
   firebase deploy --only dataconnect
   ```

3. **Generate the typed SDK.**
   ```bash
   firebase dataconnect:sdk:generate
   ```
   Output lands in `src/dataconnect-generated/` (gitignored).

4. **Add credentials.** Copy `.env.example` to `.env.local` and fill in the six
   values from Firebase console → Project settings → General → Your apps.

5. **Swap the data layer.** Replace each function body in `src/data/api.ts`
   with the matching generated hook. The signatures already line up with the
   operations in `dataconnect/connector/`:

   | `api.ts` | Data Connect operation |
   |---|---|
   | `getStats()` | `DashboardStats` |
   | `listParticipants()` | `SearchParticipants` |
   | `listRecentParticipants()` | `RecentParticipants` |
   | `getParticipant()` | `GetParticipant` |
   | `createParticipant()` | `CreateParticipant` |
   | `updateParticipant()` | `UpdateParticipant` / `UpdateMyProfile` |

6. **Wrap the app** in `QueryClientProvider` in `src/main.tsx` — the generated
   React hooks are built on TanStack Query, which is already installed.

### Local development against a real database

```bash
firebase emulators:start --only dataconnect,auth
```

### Authorization

Access control lives in the `@auth` directives on each operation, enforced
server-side — not in the React code:

- Reads require a signed-in user (`@auth(level: USER)`).
- Admin and coordinator writes check a custom claim: `auth.token.role == 'ADMIN'`.
- `GetMyProfile` and `UpdateMyProfile` resolve the row from `auth.uid` rather
  than accepting an id from the client, so one user structurally cannot read or
  write another user's record through them.

Set the role claim from a trusted server context (Cloud Function or Admin SDK):

```js
await admin.auth().setCustomUserClaims(uid, { role: "ADMIN" });
```

The `VITE_FIREBASE_*` values are bundled into the client. That is expected for
Firebase — the API key identifies the project, it doesn't authorise anything.

---

## Design

Tokens are lifted from the approved mockup and live in `src/styles/tokens.css`:

- Navy `#0F1E3D`, cream `#FAF7F2`, gold `#C4A052`
- Cormorant Garamond for display, Inter for UI, Caveat for the tagline
- Five tag colours, four status pill colours

Nothing hardcodes a colour — change a token and it changes everywhere.
