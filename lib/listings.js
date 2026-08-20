const db = require('../db/db');

function createDraftListing(data) {
  const stmt = db.prepare(`
    INSERT INTO listings
      (title, description, listing_type, district, address, lat, lng,
       price_huf, rooms, size_m2, available_from, bills_included, furnished,
       pets_allowed, owner_name, owner_email, owner_phone, status)
    VALUES
      (@title, @description, @listing_type, @district, @address, @lat, @lng,
       @price_huf, @rooms, @size_m2, @available_from, @bills_included, @furnished,
       @pets_allowed, @owner_name, @owner_email, @owner_phone, 'awaiting_payment')
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

function addListingImage(listingId, filename, sortOrder = 0) {
  db.prepare(`INSERT INTO listing_images (listing_id, filename, sort_order) VALUES (?, ?, ?)`)
    .run(listingId, filename, sortOrder);
}

function addIdDocument(listingId, filename) {
  db.prepare(`INSERT INTO id_documents (listing_id, filename) VALUES (?, ?)`)
    .run(listingId, filename);
}

function getListingById(id) {
  const listing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(id);
  if (!listing) return null;
  listing.images = db.prepare(`SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order`).all(id);
  return listing;
}

function getPublishedListings(filters = {}) {
  let sql = `SELECT * FROM listings WHERE status = 'published'`;
  const params = [];

  if (filters.district) {
    sql += ` AND district = ?`;
    params.push(filters.district);
  }
  if (filters.maxPrice) {
    sql += ` AND price_huf <= ?`;
    params.push(filters.maxPrice);
  }
  if (filters.minRooms) {
    sql += ` AND rooms >= ?`;
    params.push(filters.minRooms);
  }
  if (filters.listingType) {
    sql += ` AND listing_type = ?`;
    params.push(filters.listingType);
  }
  sql += ` ORDER BY published_at DESC`;

  const listings = db.prepare(sql).all(...params);
  const imgStmt = db.prepare(`SELECT filename FROM listing_images WHERE listing_id = ? ORDER BY sort_order LIMIT 1`);
  listings.forEach(l => {
    const img = imgStmt.get(l.id);
    l.coverImage = img ? img.filename : null;
  });
  return listings;
}

function getRecentListings(limit = 3) {
  const listings = db.prepare(`SELECT * FROM listings WHERE status = 'published' ORDER BY published_at DESC LIMIT ?`).all(limit);
  const imgStmt = db.prepare(`SELECT filename FROM listing_images WHERE listing_id = ? ORDER BY sort_order LIMIT 1`);
  listings.forEach(l => {
    const img = imgStmt.get(l.id);
    l.coverImage = img ? img.filename : null;
  });
  return listings;
}

function countPublished() {
  return db.prepare(`SELECT COUNT(*) AS c FROM listings WHERE status = 'published'`).get().c;
}

function getListingsAwaitingReview() {
  return db.prepare(`
    SELECT * FROM listings WHERE status = 'paid_pending_review' ORDER BY paid_at ASC
  `).all();
}

function getListingsAwaitingPayment() {
  return db.prepare(`
    SELECT * FROM listings WHERE status = 'awaiting_payment' ORDER BY created_at DESC
  `).all();
}

function getAllListingsForAdmin() {
  return db.prepare(`SELECT * FROM listings ORDER BY created_at DESC`).all();
}

function getIdDocuments(listingId) {
  return db.prepare(`SELECT * FROM id_documents WHERE listing_id = ?`).all(listingId);
}

function markListingPaid(listingId) {
  db.prepare(`UPDATE listings SET status = 'paid_pending_review', paid_at = datetime('now') WHERE id = ?`)
    .run(listingId);
}

function publishListing(listingId) {
  db.prepare(`UPDATE listings SET status = 'published', published_at = datetime('now') WHERE id = ?`)
    .run(listingId);
}

function rejectListing(listingId, note) {
  db.prepare(`UPDATE listings SET status = 'rejected', admin_note = ? WHERE id = ?`)
    .run(note || null, listingId);
}

module.exports = {
  createDraftListing,
  addListingImage,
  addIdDocument,
  getListingById,
  getPublishedListings,
  getRecentListings,
  countPublished,
  getListingsAwaitingReview,
  getListingsAwaitingPayment,
  getAllListingsForAdmin,
  getIdDocuments,
  markListingPaid,
  publishListing,
  rejectListing,
};
