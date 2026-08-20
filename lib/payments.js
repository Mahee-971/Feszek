const db = require('../db/db');

const LISTING_FEE_HUF = parseInt(process.env.LISTING_FEE_HUF || '500', 10);

function createPaymentRecord(listingId, providerPaymentId, status = 'pending') {
  const info = db.prepare(`
    INSERT INTO payments (listing_id, provider, provider_payment_id, amount, currency, status)
    VALUES (?, 'barion', ?, ?, 'HUF', ?)
  `).run(listingId, providerPaymentId, LISTING_FEE_HUF, status);
  return info.lastInsertRowid;
}

function getPaymentByProviderId(providerPaymentId) {
  return db.prepare(`SELECT * FROM payments WHERE provider_payment_id = ?`).get(providerPaymentId);
}

function getLatestPaymentForListing(listingId) {
  return db.prepare(`
    SELECT * FROM payments WHERE listing_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(listingId);
}

function markPaymentSucceeded(providerPaymentId) {
  db.prepare(`UPDATE payments SET status = 'succeeded', paid_at = datetime('now') WHERE provider_payment_id = ?`)
    .run(providerPaymentId);
}

function markPaymentFailed(providerPaymentId) {
  db.prepare(`UPDATE payments SET status = 'failed' WHERE provider_payment_id = ?`)
    .run(providerPaymentId);
}

function markPaymentManual(listingId) {
  db.prepare(`
    INSERT INTO payments (listing_id, provider, amount, currency, status, paid_at)
    VALUES (?, 'manual', ?, 'HUF', 'succeeded', datetime('now'))
  `).run(listingId, LISTING_FEE_HUF);
}

module.exports = {
  LISTING_FEE_HUF,
  createPaymentRecord,
  getPaymentByProviderId,
  getLatestPaymentForListing,
  markPaymentSucceeded,
  markPaymentFailed,
  markPaymentManual,
};
