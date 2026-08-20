const express = require('express');
const router = express.Router();
const listings = require('../lib/listings');
const marketplace = require('../lib/marketplace');
const services = require('../lib/services');

const DISTRICTS = [
  'I. kerület', 'II. kerület', 'III. kerület', 'IV. kerület', 'V. kerület',
  'VI. kerület', 'VII. kerület', 'VIII. kerület', 'IX. kerület', 'X. kerület',
  'XI. kerület', 'XII. kerület', 'XIII. kerület', 'XIV. kerület', 'XV. kerület',
  'XVI. kerület', 'XVII. kerület', 'XVIII. kerület', 'XIX. kerület', 'XX. kerület',
  'XXI. kerület', 'XXII. kerület', 'XXIII. kerület',
];

// Homepage is now a hub across all three sections of the site.
router.get('/', (req, res) => {
  res.render('home', {
    recentApartments: listings.getRecentListings(3),
    apartmentCount: listings.countPublished(),
    recentItems: marketplace.getRecentItems(3),
    itemCount: marketplace.countActive(),
    recentServices: services.getRecentPosts(3),
    serviceCount: services.countActive(),
  });
});

router.get('/apartments', (req, res) => {
  const filters = {
    district: req.query.district || null,
    maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice, 10) : null,
    minRooms: req.query.minRooms ? parseFloat(req.query.minRooms) : null,
    listingType: req.query.listingType || null,
  };
  const results = listings.getPublishedListings(filters);
  res.render('apartments', { results, filters, districts: DISTRICTS });
});

router.get('/listing/:id', (req, res) => {
  const listing = listings.getListingById(req.params.id);
  if (!listing || listing.status !== 'published') {
    return res.status(404).render('not_found');
  }
  res.render('listing', { listing });
});

router.get('/list-your-place', (req, res) => {
  res.render('submit', { districts: DISTRICTS, error: null, old: {} });
});

module.exports = router;
module.exports.DISTRICTS = DISTRICTS;
