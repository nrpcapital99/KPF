# Kanak Parakh Foundation — Volunteer form

A public volunteer registration form, and a private page where the team sees
responses as they arrive.

- **Live:** https://kp-foundation-db18a.web.app
- **Team page:** https://kp-foundation-db18a.web.app/admin

There is no backend server. It's a React front end talking directly to
**Cloud Firestore**. Who can read and write what is enforced by
[`firestore.rules`](firestore.rules), not by the app.

## What's in it

**The form (`/`)**: anyone can fill it in, no account needed.
Name, phone/WhatsApp, email and city; **how they'd like to help**: people
first choose their area(s) (Teaching & Education, Website & Technology, ...,
or Other ways to contribute), then a dropdown appears for each chosen area to
tick what they can do; time they can give (1 to 2 or 3 to 4 hrs a week); when
they're free; and any more information.
Validation is inline and friendly, and a hidden honeypot field quietly
swallows bot submissions.

**The team page (`/admin`)**: sign in with a team account to:

- see responses live, newest first, with no refresh needed
- search, and filter by status or help area, e.g. everyone who can help with
  Website & Technology
- call, WhatsApp or email someone in one tap
- move a response through *New → Contacted → Joined → Archived*
- add private team notes
- export what you're looking at to CSV (opens correctly in Excel)
- delete spam

Both pages adapt to phones, tablets and desktops in either orientation.

**Google Sheet**: responses can also flow into a Google Sheet automatically.
See [`google-sheets/SETUP.md`](google-sheets/SETUP.md) (about 5 minutes, once).

## Running it locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. It uses the live Firebase project from `.env`,
so anything submitted locally is real.

## Deploying

```bash
firebase deploy --only firestore:rules,hosting
```

`hosting` builds first automatically. Deploy the rules and the site together.
They depend on each other.

## Adding a team member

1. Firebase console → **Authentication** → **Add user** (email + password),
   unless they already have an account.
2. Copy their **User UID**.
3. Firebase console → **Firestore Database** → collection **`admins`** →
   **Add document**. Use the UID as the **Document ID**. Any field is fine,
   e.g. `name: "Priya"`.

They can now sign in at `/admin`. To remove someone, delete their `admins`
document.

If a signed-in account isn't a team member, the team page says so and shows
the account's UID with a copy button, so step 3 is easy.

## Changing the form's options

The options for *how you'd like to help*, *time you can give* and *when you're
free* are defined in [`src/config.ts`](src/config.ts). The same option IDs also
appear in two other places:

- **`firestore.rules`**: rejects any value that isn't on its list
- **`google-sheets/Code.gs`**: turns IDs into readable labels in the Sheet

Change all three together. `npm run build` (and therefore `firebase deploy`)
runs `npm run check:options` first and **stops if they don't match**, naming
exactly what's out of step. After deploying, paste the updated `Code.gs` into
the Sheet's Apps Script and run **Kanak Parakh → Full resync**.

## Project layout

```
src/
  form/          the public form: page, validation, submit (Firestore Lite)
  admin/         the team page: sign in, responses, cards, CSV export
  components/    brand mark and icons
  styles/        design tokens and shared styles
  config.ts      form options, limits, foundation name
  assets/        the foundation logo and its gold monogram
public/          favicon and phone home-screen icon (from the monogram)
google-sheets/   Apps Script that copies responses into a Google Sheet
scripts/         check-options.mjs: keeps options in step across files
firestore.rules
firebase.json    hosting: SPA rewrites, caching, security headers
```

## Performance notes

- A volunteer on a phone downloads about **75 kB** (gzipped) to see the form.
  The database code loads quietly in the background, and the sign-in and
  team-page code is never downloaded by volunteers.
- Hashed assets are cached for a year; the page itself is never cached, so a
  deploy reaches everyone immediately. In `firebase.json` the broad `**`
  header rule must stay **before** the `/assets/**` one. Firebase applies the
  last match, and reversing them silently disables asset caching.
