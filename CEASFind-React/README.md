# CEAS FIND (React)

Lost & found platform for Gordon College CEAS.

- `FRONTEND/` — React single-page app (Vite + React Router). Signs users in with Firebase Auth (Google, `@gordoncollege.edu.ph` only).
- `BACKEND/` — Express API (`/api/...`) backed by Firestore via the Admin SDK; sends claim / return-offer emails over SMTP.
- `elements/` — shared images, served at `/elements/...`.

## Setup

The backend needs two files that are not committed:

- `BACKEND/config/serviceAccountKey.json` — Firebase service account key for the `ceasfind` project.
- `BACKEND/.env`:

  ```
  SMTP_USER=you@gordoncollege.edu.ph
  SMTP_PASS=your-16-character-app-password
  ADMIN_EMAILS=admin1@gordoncollege.edu.ph,admin2@gordoncollege.edu.ph
  ```

Install dependencies:

```
cd BACKEND && npm install
cd ../FRONTEND && npm install
```

## Development

Run both, in two terminals:

```
cd BACKEND && npm run dev      # API on http://localhost:3000
cd FRONTEND && npm run dev     # app on http://localhost:5173 (proxies /api to :3000)
```

## Production

```
cd FRONTEND && npm run build   # outputs FRONTEND/dist
cd ../BACKEND && npm start     # serves the built app + API on http://localhost:3000
```

To host the frontend somewhere else, build with `VITE_API_URL=https://your-api-host/api`.

## Pages

| Route | Page |
| --- | --- |
| `/` | Landing |
| `/auth` | Google sign-in, terms, course-code registration |
| `/home` | Feed with category filter (`?category=`) and search (`?q=`) |
| `/post`, `/post?edit=<id>` | Report a lost / found item, or edit your post |
| `/claim/<id>` | Claim a found item (proof of ownership) |
| `/return/<id>` | Offer to return a lost item |
| `/saved` | Bookmarks |
| `/history` | Your posts |
| `/notifications` | Claims and return offers on your posts |
| `/pending` | Claims you've submitted |
| `/review` | Approve claims on your found items |
| `/profile?user=<email>` | A user's posts |

Old `*.html` URLs (e.g. shared `proof-page.html?postId=…` links) redirect to the new routes.
