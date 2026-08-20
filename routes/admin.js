const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../lib/auth');
const listingsLib = require('../lib/listings');
const paymentsLib = require('../lib/payments');
const marketLib = require('../lib/marketplace');
const servicesLib = require('../lib/services');
const { ID_CARDS_DIR } = require('../lib/paths');

router.get('/admin/login', (req, res) => {
  res.render('admin_login', { error: null });
});

router.post('/admin/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  if (username !== expectedUser || !hash || !bcrypt.compareSync(password || '', hash)) {
    return res.render('admin_login', { error: 'Invalid username or password.' });
  }
  req.session.isAdmin = true;
  res.redirect('/admin');
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/admin', requireAdmin, (req, res) => {
  const pendingReview = listingsLib.getListingsAwaitingReview();
  const awaitingPayment = listingsLib.getListingsAwaitingPayment();
  const all = listingsLib.getAllListingsForAdmin();
  const reportedItems = marketLib.getReportedItems();
  const allItems = marketLib.getAllItemsForAdmin();
  const reportedServices = servicesLib.getReportedPosts();
  const allServices = servicesLib.getAllPostsForAdmin();
  res.render('admin_dashboard', {
    pendingReview, awaitingPayment, all,
    reportedItems, allItems,
    reportedServices, allServices,
  });
});

router.get('/admin/listing/:id', requireAdmin, (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');
  const idDocs = listingsLib.getIdDocuments(listing.id);
  const payment = paymentsLib.getLatestPaymentForListing(listing.id);
  res.render('admin_listing', { listing, idDocs, payment });
});

// ID card images are only ever served through this authenticated route,
// never via a public/static path.
router.get('/admin/id-card/:filename', requireAdmin, (req, res) => {
  const filename = path.basename(req.params.filename); // strip any path traversal
  const filePath = path.join(ID_CARDS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

router.post('/admin/listing/:id/approve', requireAdmin, (req, res) => {
  listingsLib.publishListing(req.params.id);
  res.redirect('/admin');
});

router.post('/admin/listing/:id/reject', requireAdmin, express.urlencoded({ extended: true }), (req, res) => {
  listingsLib.rejectListing(req.params.id, req.body.note);
  res.redirect('/admin');
});

router.post('/admin/listing/:id/mark-paid', requireAdmin, (req, res) => {
  paymentsLib.markPaymentManual(req.params.id);
  listingsLib.markListingPaid(req.params.id);
  res.redirect('/admin');
});

// --- Marketplace moderation ---
router.post('/admin/marketplace/:id/remove', requireAdmin, express.urlencoded({ extended: true }), (req, res) => {
  marketLib.removeItem(req.params.id, req.body.note);
  res.redirect('/admin');
});

router.post('/admin/marketplace/:id/dismiss-reports', requireAdmin, (req, res) => {
  marketLib.dismissReports(req.params.id);
  res.redirect('/admin');
});

// --- Jobs & Services moderation ---
router.post('/admin/services/:id/remove', requireAdmin, express.urlencoded({ extended: true }), (req, res) => {
  servicesLib.removePost(req.params.id, req.body.note);
  res.redirect('/admin');
});

router.post('/admin/services/:id/dismiss-reports', requireAdmin, (req, res) => {
  servicesLib.dismissReports(req.params.id);
  res.redirect('/admin');
});

module.exports = router;
