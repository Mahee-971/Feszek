-- Budapest Rentals schema

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'apartment',   -- apartment | room
  district TEXT,                                     -- e.g. "VII. kerület"
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  price_huf INTEGER NOT NULL,
  rooms REAL,
  size_m2 INTEGER,
  available_from TEXT,
  bills_included INTEGER DEFAULT 0,
  furnished INTEGER DEFAULT 0,
  pets_allowed INTEGER DEFAULT 0,

  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  -- awaiting_payment -> paid_pending_review -> published
  --                                          -> rejected
  admin_note TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ID card images are kept separate from listing photos and are NEVER
-- served on any public route -- only through the authenticated admin panel.
CREATE TABLE IF NOT EXISTS id_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'barion',
  provider_payment_id TEXT,
  amount INTEGER NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT 'HUF',
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | succeeded | failed | manual
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- ============================================================
-- Marketplace (free move-out items — furniture, bikes, etc.)
-- Added when the site grew from apartments-only into a full
-- multi-category board. Uses its own tables so the apartment
-- listings above are never touched by this migration.
-- ============================================================
CREATE TABLE IF NOT EXISTS market_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,       -- furniture | electronics | bikes | kitchen | books | clothing | other
  condition_label TEXT NOT NULL DEFAULT 'used', -- new | like_new | used | well_used
  is_free INTEGER NOT NULL DEFAULT 0,
  price_huf INTEGER,             -- null when is_free = 1
  district TEXT,
  pickup_note TEXT,

  seller_name TEXT NOT NULL,
  seller_contact TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'active', -- active | removed
  report_count INTEGER NOT NULL DEFAULT 0,
  admin_note TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  removed_at TEXT
);

CREATE TABLE IF NOT EXISTS market_item_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS market_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Jobs & Services (tutoring, roommate finder, part-time gigs)
-- Free to post, no photos required, same moderation pattern
-- as the marketplace above.
-- ============================================================
CREATE TABLE IF NOT EXISTS service_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT NOT NULL,   -- tutoring | roommate | part_time_job | other
  compensation_huf INTEGER,      -- null = unpaid / negotiable / not applicable
  district TEXT,

  poster_name TEXT NOT NULL,
  poster_contact TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'active', -- active | removed
  report_count INTEGER NOT NULL DEFAULT 0,
  admin_note TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  removed_at TEXT
);

CREATE TABLE IF NOT EXISTS service_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES service_posts(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
