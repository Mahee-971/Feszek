# Budapest Rentals

A student-focused listing site for Budapest with three sections under one
brand: **Apartments** (the original no-fee rental board), **Marketplace**
(a free move-out board for furniture/bikes/etc.), and **Jobs & Services**
(tutoring, roommate finder, part-time gigs). Browsing and contacting posters
is free everywhere on the site — the only fee is the one-time **500 Ft**
apartment owners pay to publish a rental listing, which is how the site
makes money. Marketplace and Jobs & Services are free to post, always — see
"Why the sections are priced differently" below.

## What's included

**Homepage (`/`)** — a hub showing all three sections with recent posts from
each, so the site reads as one destination rather than three separate tools.

**Apartments** (unchanged from the original site — this is the part that's
already live and making money, and nothing about its code path changed):
- **Browse page** (`/apartments`) — filter by district, price, rooms, apartment vs. room.
- **Listing detail page** (`/listing/:id`) — photos, description, an OpenStreetMap
  pin, and the owner's direct contact info. No sign-up needed to view or contact.
- **"List your place" form** (`/list-your-place`) — owners enter the apartment
  details, drop a pin on a map, upload photos, and upload a photo/scan of
  their ID card for verification, plus their contact details.
- **Payment step** — a 500 Ft charge via **Barion**, see "Connecting real
  payments" below. Runs in demo mode until you configure a real Barion account.
- Listings go through **admin review** (ID check) before they go live.

**Marketplace** (new — folded in from the separate BudapestSwap prototype):
- **Browse page** (`/marketplace`) — filter by category, district, max price, "free only."
- **Item detail page** (`/marketplace/:id`) — photos, description, condition,
  pickup area, seller's contact shown directly.
- **Post an item** (`/marketplace/post`) — always free, publishes immediately,
  no ID or payment involved.
- **Report button** on every item — flags it for a human to review in `/admin`.

**Jobs & Services** (new):
- **Browse page** (`/services`) — filter by type (tutoring / roommate / part-time
  job / other) and district.
- **Post detail page** (`/services/:id`) — description, optional pay/price, contact info.
- **Post** (`/services/post`) — free, text-only (no photo upload), publishes immediately.
- **Report button**, same moderation pattern as Marketplace.

**Admin panel** (`/admin`) — one login, one dashboard, covering all three
sections: apartment listings awaiting payment/review, reported Marketplace
items, and reported Jobs & Services posts, each with approve/remove/dismiss actions.

### Why the sections are priced differently

Apartments involve real money (a full rental deposit and monthly rent) and a
real lease, so the 500 Ft fee + ID verification earns its keep — it's the
site's only revenue and a basic trust signal for a big-ticket transaction.
Marketplace items are a few thousand Ft or free, and Jobs & Services posts
often aren't financial transactions at all — charging a fee or requiring ID
there would just suppress posting without adding meaningful trust. Both
newer sections instead rely on public contact info, a report button, and
light human moderation after the fact.

## Running it locally

```bash
npm install
cp .env.example .env     # then edit .env, see below
npm run seed              # optional: adds 4 sample listings so the board isn't empty
npm start
```

Open http://localhost:3000. Admin panel: http://localhost:3000/admin/login

The `.env` shipped in this project already has a **demo admin login**
(`admin` / `demo1234`) so you can click around immediately — change this
before putting the site online (see below).

## Environment variables (`.env`)

See `.env.example` for the full list with comments. The important ones:

| Variable | Purpose |
|---|---|
| `PUBLIC_BASE_URL` | Your real domain once deployed (used to build Barion redirect URLs) |
| `LISTING_FEE_HUF` | The fee owners pay to publish (defaults to 500) |
| `SESSION_SECRET` | Random string for signing login cookies — change this |
| `BARION_POSKEY` | Your Barion merchant "POSKey" — leave empty to stay in demo mode |
| `BARION_ENV` | `test` (Barion sandbox) or `production` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` | Your admin login (see below to generate) |

### Setting your own admin password

```bash
node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"
```

Paste the output into `ADMIN_PASSWORD_HASH` in `.env`.

## Connecting real payments (Barion)

The 500 Ft fee is wired up for **Barion** (barion.com), a Hungarian payment
provider with a well-documented API, HUF support, and a free sandbox — a solid
default for a small flat-fee like this. To go live:

1. Register a Barion account and create a "Webshop" in their dashboard.
2. Copy the Webshop's **POSKey**.
3. Set in `.env`:
   ```
   BARION_POSKEY=your-poskey-here
   BARION_ENV=production
   BARION_PAYEE_EMAIL=your-barion-account-email@example.com
   PUBLIC_BASE_URL=https://your-real-domain.com
   ```
4. Restart the app. The payment step will now redirect to Barion's real
   hosted checkout instead of the demo screen.

Prefer a different provider (SimplePay/OTP, Stripe, etc.) or just want to
collect payment manually via bank transfer for now? The admin dashboard has a
**"Mark paid"** button on any unpaid listing — use that and skip the Barion
setup entirely if you'd rather handle payments outside the site at first.

## Important: ID card storage and privacy (please read)

You chose to collect and store owners' ID card photos so you can manually
verify each listing before it goes live. This is sensitive personal data, and
storing it comes with real legal responsibilities under GDPR (which applies
to any site handling EU residents' personal data, regardless of where the
site is hosted):

- ID card images are stored in `uploads/id_cards/` and are **only ever served
  through the authenticated `/admin/id-card/:filename` route** — there is no
  public URL for them, and they're excluded from the public `/uploads/photos`
  static folder on purpose. Don't change that wiring.
- You should have a clear, written privacy policy telling owners what you
  collect, why, how long you keep it, and how they can ask for it to be
  deleted — and actually honor deletion requests.
- Consider deleting the ID image once you've verified a listing and keeping
  only a note that verification happened, rather than keeping the image
  forever — the less sensitive data you store long-term, the less risk and
  legal obligation you carry.
- Keep backups of the `uploads/id_cards` folder and the database encrypted,
  and restrict server access to yourself.
- This project is a technical starting point, not legal advice — if you're
  serious about launching this, it's worth a quick consult with a lawyer
  about GDPR obligations for handling ID documents, especially before you
  have real users' documents on your server.

## Deploying

This is a plain Node/Express app with a SQLite database file — it needs a
host with a **persistent filesystem** (SQLite and the uploaded photos/ID
files live on disk), so a classic "serverless function" host (like default
Vercel) won't work well here. Good fits: **Railway.app** (recommended —
see the walkthrough below), **Render.com** (note: its free tier has *no*
persistent disk, so listings/photos would be wiped on every restart —
you'd need a paid plan there), or any small **VPS** running `npm start`
behind a reverse proxy with a Let's Encrypt certificate.

### One persistent folder, via `DATA_DIR`

The database and every uploaded file (photos, ID cards) are stored under
one configurable root folder, controlled by the `DATA_DIR` environment
variable (see `lib/paths.js`). Locally this defaults to the project folder
itself, so nothing changes for local dev. In production, mount your host's
persistent volume at a path like `/data` and set `DATA_DIR=/data` — that's
the only thing that needs to survive restarts/redeploys.

### Deploying to Railway, step by step

1. **Get the code onto GitHub.** Unzip this project locally, create a free
   GitHub account if you don't have one, then create a new repository and
   push/upload this folder to it. **Do not upload the `.env` file** — it's
   already listed in `.gitignore` so tools like GitHub Desktop will skip it
   automatically; if you're using the plain "upload files" button on
   github.com, just double-check `.env` isn't in the list before you commit.
2. **Sign up at railway.app**, logging in with your GitHub account (this
   also makes the next step one click).
3. **New Project → Deploy from GitHub repo** → pick your repo. Railway
   detects the Node app and runs `npm install` / `npm start` automatically.
4. **Add a volume** in the service's Settings → Volumes. Mount it at `/data`.
5. **Set environment variables** in the service's Variables tab — copy every
   line from `.env.example`, filling in real values. Critically, set
   `DATA_DIR=/data` (matching the volume's mount path from step 4),
   generate a real `SESSION_SECRET`, and set your own `ADMIN_USERNAME` /
   `ADMIN_PASSWORD_HASH` (command to generate the hash is above) — don't
   launch with the demo admin login.
6. Railway gives you a live URL immediately, e.g. `your-app.up.railway.app`.
   Test it end to end (browse, submit a listing, pay via the demo checkout,
   approve it in `/admin`) before pointing a real domain at it.
7. **Custom domain:** once you've bought a domain, add it under the
   service's Settings → Networking → Custom Domain, and set
   `PUBLIC_BASE_URL` to `https://your-domain.com` in the Variables tab.

## Project structure

```
server.js              App entrypoint — mounts every router below
routes/                 public.js (hub homepage + apartment browse/detail),
                         listing_submit.js (apartment owner form), payment.js (Barion),
                         marketplace.js (browse/detail/post/report),
                         services.js (browse/detail/post/report),
                         admin.js (one panel covering all three sections)
lib/                     listings.js, payments.js, barion.js, auth.js, upload.js,
                         marketplace.js, services.js
db/                      schema.sql, db.js, seed.js, data.sqlite (created on first run)
views/                   EJS templates — home.ejs is the hub; apartments/marketplace_*/
                         services_* are the three sections
public/                  CSS, client-side JS, self-hosted Leaflet assets
uploads/photos/          Public photos (apartment + marketplace)
uploads/id_cards/        Private — admin-only, never served publicly (apartments only)
```

## Redeploying your live site with this update

If Budapest Rentals is already live on Railway with real listings, this
update is safe to push over it — no data migration needed:

- The database migration only **adds** new tables (`market_items`,
  `service_posts`, and their supporting tables) via `CREATE TABLE IF NOT
  EXISTS`. The existing `listings` table and everything in it is untouched.
- The apartment browse page's URL changed from `/` to `/apartments` (the
  homepage is now the three-section hub). If you shared a direct link to
  `/` anywhere (Facebook post, etc.), it still works — it just shows the
  new hub page instead of the apartment list directly, with a prominent
  "Browse apartments" button on it.
- Just push this code to the same GitHub repo Railway is watching (or
  re-upload if you're not using git push), and Railway will redeploy
  automatically. No new environment variables are required — Marketplace
  and Jobs & Services reuse the same `DATA_DIR`, session, and admin login
  you already have configured.
- Run `npm run seed` once locally if you want demo Marketplace/Jobs posts
  for testing — it only seeds each table if it's empty, so it won't touch
  real data or duplicate anything on a second run.

## A few product notes

- Map pins and address geocoding use **OpenStreetMap + Nominatim** — free,
  no API key required. Leaflet's JS/CSS are bundled locally in
  `public/vendor/leaflet` rather than pulled from a CDN, so the site doesn't
  depend on a third party being up (the map *tiles* themselves still load
  from OpenStreetMap's tile servers at view time, which is normal for any
  Leaflet/OSM map).
- District list covers all 23 Budapest kerületek.
- No tenant accounts, ever — by design, per your original ask: tenants just
  browse and contact owners directly, free.
