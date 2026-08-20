const db = require('../db/db');

function createPost(data) {
  const stmt = db.prepare(`
    INSERT INTO service_posts
      (title, description, service_type, compensation_huf, district,
       poster_name, poster_contact, status)
    VALUES
      (@title, @description, @service_type, @compensation_huf, @district,
       @poster_name, @poster_contact, 'active')
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

function getPostById(id) {
  return db.prepare(`SELECT * FROM service_posts WHERE id = ?`).get(id);
}

function getActivePosts(filters = {}) {
  let sql = `SELECT * FROM service_posts WHERE status = 'active'`;
  const params = [];

  if (filters.serviceType) {
    sql += ` AND service_type = ?`;
    params.push(filters.serviceType);
  }
  if (filters.district) {
    sql += ` AND district = ?`;
    params.push(filters.district);
  }
  sql += ` ORDER BY created_at DESC`;

  return db.prepare(sql).all(...params);
}

function getRecentPosts(limit = 3) {
  return db.prepare(`SELECT * FROM service_posts WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`).all(limit);
}

function countActive() {
  return db.prepare(`SELECT COUNT(*) AS c FROM service_posts WHERE status = 'active'`).get().c;
}

function getAllPostsForAdmin() {
  return db.prepare(`SELECT * FROM service_posts ORDER BY report_count DESC, created_at DESC`).all();
}

function getReportedPosts() {
  return db.prepare(`SELECT * FROM service_posts WHERE report_count > 0 AND status = 'active' ORDER BY report_count DESC`).all();
}

function addReport(postId, reason) {
  db.prepare(`INSERT INTO service_reports (post_id, reason) VALUES (?, ?)`).run(postId, reason || null);
  db.prepare(`UPDATE service_posts SET report_count = report_count + 1 WHERE id = ?`).run(postId);
}

function removePost(postId, note) {
  db.prepare(`UPDATE service_posts SET status = 'removed', admin_note = ?, removed_at = datetime('now') WHERE id = ?`)
    .run(note || null, postId);
}

function dismissReports(postId) {
  db.prepare(`UPDATE service_posts SET report_count = 0 WHERE id = ?`).run(postId);
}

module.exports = {
  createPost,
  getPostById,
  getActivePosts,
  getRecentPosts,
  countActive,
  getAllPostsForAdmin,
  getReportedPosts,
  addReport,
  removePost,
  dismissReports,
};
