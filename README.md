# Kanak Parakh Foundation

A role-based volunteer operations app for the Kanak Parakh Foundation. It uses
React, TypeScript, Firebase Authentication, and Cloud Firestore.

## What is included

- First-run setup for the initial administrator
- Email/password sign-in with Firebase Authentication
- Public volunteer applications and admin approval
- Admin/coordinator slot creation and signup review
- Volunteer opportunity discovery, requests, withdrawals, and commitments
- Participant directory with search and filters
- Editable profiles, project teams, and a shared resource library
- Responsive desktop and mobile navigation
- Realtime Firestore listeners and role-based Firestore Security Rules
- Firebase Hosting single-page-app configuration

## Run locally

The supplied Firebase web configuration is stored in the ignored `.env.local`.
For another Firebase project, copy `.env.example` to `.env.local` and replace
the values.

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run build
npm run lint
```

## Firebase project setup

Before the app can create its first administrator:

1. In the Firebase console, create a **Cloud Firestore** database in production
   mode. Choose the database region deliberately; it cannot be changed later.
2. Under Authentication > Sign-in method, enable **Email/Password**.
3. Install or run the Firebase CLI and deploy the rules and indexes:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```

4. Start the app and complete the one-time administrator setup screen. The
   bootstrap transaction creates `config/foundation` and the first admin
   participant atomically.

The `.firebaserc` file points at `kp-foundation-db18a`. Change its default
project before deploying if you use a different Firebase project.

## Local Firebase emulators

Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local`, then run:

```bash
npx firebase-tools emulators:start --only auth,firestore
npm run dev
```

The app connects to Auth on port 9099 and Firestore on port 8080 when that flag
is enabled.

## Firestore model

The app uses these top-level collections:

- `config` — one-time foundation bootstrap state
- `participants` — approved members and their embedded expertise
- `accountRequests` — volunteer applications keyed by Firebase UID
- `slots` — volunteering opportunities
- `signups` — volunteer requests and attendance outcomes
- `projects` — projects with embedded member IDs

Approved account requests become participant documents whose document ID is the
same Firebase UID. That makes self-service profile and signup rules simple and
auditable. Small related values are embedded where appropriate, while signups
remain separate because they have their own approval lifecycle.

## Security

`firestore.rules` denies access by default. It grants:

- public read access only to the bootstrap configuration document;
- request creation/read access to the matching Firebase UID;
- directory and operational reads to active participants;
- slot, project, resource, and approval writes to staff;
- role/status administration to admins;
- limited self-profile edits and signup withdrawals to the record owner.

Rules must be deployed before the browser app can use Firestore.

## Deploy the web app

```bash
npm run build
npx firebase-tools deploy --only hosting
```

Firebase Hosting serves `dist/` and rewrites unknown routes to `index.html` for
React Router.
