const db = require('../db/db');

function createItem(data) {
  const stmt = db.prepare(`
    INSERT INTO market_items
      (title, description, category, condition_label, is_free, price_huf,
       district, pickup_note, seller_name, seller_contact, status)
    VALUES
      (@title, @description, @category, @condition_label, @is_free, @price_huf,
       @district, @pickup_note, @seller_name, @seller_contact, 'active')
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

function addItemImage(itemId, filename, sortOrder = 0) {
  db.prepare(`INSERT INTO market_item_images (item_id, filename, sort_order) VALUES (?, ?, ?)`)
    .run(itemId, filename, sortOrder);
}

function getItemById(id) {
  const item = db.prepare(`SELECT * FROM market_items WHERE id = ?`).get(id);
  if (!item) return null;
  item.images = db.prepare(`SELECT * FROM market_item_images WHERE item_id = ? ORDER BY sort_order`).all(id);
  return item;
}

function getActiveItems(filters = {}) {
  let sql = `SELECT * FROM market_items WHERE status = 'active'`;
  const params = [];

  if (filters.category) {
    sql += ` AND category = ?`;
    params.push(filters.category);
  }
  if (filters.district) {
    sql += ` AND district = ?`;
    params.push(filters.district);
  }
  if (filters.maxPrice) {
    sql += ` AND (is_free = 1 OR price_huf <= ?)`;
    params.push(filters.maxPrice);
  }
  if (filters.freeOnly) {
    sql += ` AND is_free = 1`;
  }
  sql += ` ORDER BY created_at DESC`;

  const items = db.prepare(sql).all(...params);
  const imgStmt = db.prepare(`SELECT filename FROM market_item_images WHERE item_id = ? ORDER BY sort_order LIMIT 1`);
  items.forEach((it) => {
    const img = imgStmt.get(it.id);
    it.coverImage = img ? img.filename : null;
  });
  return items;
}

function getRecentItems(limit = 3) {
  const items = db.prepare(`SELECT * FROM market_items WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`).all(limit);
  const imgStmt = db.prepare(`SELECT filename FROM market_item_images WHERE item_id = ? ORDER BY sort_order LIMIT 1`);
  items.forEach((it) => {
    const img = imgStmt.get(it.id);
    it.coverImage = img ? img.filename : null;
  });
  return items;
}

function countActive() {
  return db.prepare(`SELECT COUNT(*) AS c FROM market_items WHERE status = 'active'`).get().c;
}

function getAllItemsForAdmin() {
  return db.prepare(`SELECT * FROM market_items ORDER BY report_count DESC, created_at DESC`).all();
}

function getReportedItems() {
  return db.prepare(`SELECT * FROM market_items WHERE report_count > 0 AND status = 'active' ORDER BY report_count DESC`).all();
}

function addReport(itemId, reason) {
  db.prepare(`INSERT INTO market_reports (item_id, reason) VALUES (?, ?)`).run(itemId, reason || null);
  db.prepare(`UPDATE market_items SET report_count = report_count + 1 WHERE id = ?`).run(itemId);
}

function removeItem(itemId, note) {
  db.prepare(`UPDATE market_items SET status = 'removed', admin_note = ?, removed_at = datetime('now') WHERE id = ?`)
    .run(note || null, itemId);
}

function dismissReports(itemId) {
  db.prepare(`UPDATE market_items SET report_count = 0 WHERE id = ?`).run(itemId);
}

module.exports = {
  createItem,
  addItemImage,
  getItemById,
  getActiveItems,
  getRecentItems,
  countActive,
  getAllItemsForAdmin,
  getReportedItems,
  addReport,
  removeItem,
  dismissReports,
};
