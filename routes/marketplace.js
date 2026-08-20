const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const marketLib = require('../lib/marketplace');
const { PHOTOS_DIR } = require('../lib/paths');

const CATEGORIES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'bikes', label: 'Bikes & Transport' },
  { value: 'kitchen', label: 'Kitchen & Appliances' },
  { value: 'books', label: 'Books & Study' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'used', label: 'Used' },
  { value: 'well_used', label: 'Well used' },
];

const DISTRICTS = [
  'I. kerület', 'II. kerület', 'III. kerület', 'IV. kerület', 'V. kerület',
  'VI. kerület', 'VII. kerület', 'VIII. kerület', 'IX. kerület', 'X. kerület',
  'XI. kerület', 'XII. kerület', 'XIII. kerület', 'XIV. kerület', 'XV. kerület',
  'XVI. kerület', 'XVII. kerület', 'XVIII. kerület', 'XIX. kerület', 'XX. kerület',
  'XXI. kerület', 'XXII. kerület', 'XXIII. kerület',
];

function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}
function conditionLabel(value) {
  const found = CONDITIONS.find((c) => c.value === value);
  return found ? found.label : value;
}

router.get('/marketplace', (req, res) => {
  const filters = {
    category: req.query.category || null,
    district: req.query.district || null,
    maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice, 10) : null,
    freeOnly: req.query.freeOnly === '1',
  };
  const results = marketLib.getActiveItems(filters);
  res.render('marketplace_index', { results, filters, categories: CATEGORIES, districts: DISTRICTS, categoryLabel });
});

router.get('/marketplace/post', (req, res) => {
  res.render('marketplace_post', { categories: CATEGORIES, conditions: CONDITIONS, districts: DISTRICTS, error: null, old: {} });
});

router.get('/marketplace/:id', (req, res) => {
  const item = marketLib.getItemById(req.params.id);
  if (!item || item.status !== 'active') return res.status(404).render('not_found');
  res.render('marketplace_item', { item, categoryLabel, conditionLabel, posted: req.query.posted === '1' });
});

router.post('/marketplace/:id/report', express.urlencoded({ extended: true }), (req, res) => {
  const item = marketLib.getItemById(req.params.id);
  if (!item) return res.status(404).render('not_found');
  marketLib.addReport(item.id, req.body.reason);
  res.render('reported', { title: item.title, backHref: '/marketplace' });
});

const uploadPhotos = multer({
  storage: multer.diskStorage({
    destination: PHOTOS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only JPG, PNG or WEBP images are allowed'), ok);
  },
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
}).array('photos', 6);

router.post('/marketplace/post', (req, res) => {
  uploadPhotos(req, res, (err) => {
    const formOpts = { categories: CATEGORIES, conditions: CONDITIONS, districts: DISTRICTS };
    if (err) {
      return res.render('marketplace_post', { ...formOpts, error: err.message, old: req.body });
    }

    const body = req.body;
    const requiredFields = ['title', 'description', 'category', 'condition_label', 'seller_name', 'seller_contact'];
    for (const f of requiredFields) {
      if (!body[f] || String(body[f]).trim() === '') {
        return res.render('marketplace_post', { ...formOpts, error: `Please fill in "${f.replace('_', ' ')}".`, old: body });
      }
    }
    const isFree = body.is_free === 'on' || body.is_free === '1';
    if (!isFree && (!body.price_huf || parseInt(body.price_huf, 10) <= 0)) {
      return res.render('marketplace_post', { ...formOpts, error: 'Enter a price, or check "giving away for free".', old: body });
    }
    if (!req.files || req.files.length === 0) {
      return res.render('marketplace_post', { ...formOpts, error: 'Please add at least one photo.', old: body });
    }

    const itemId = marketLib.createItem({
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      condition_label: body.condition_label,
      is_free: isFree ? 1 : 0,
      price_huf: isFree ? null : parseInt(body.price_huf, 10),
      district: body.district || null,
      pickup_note: body.pickup_note ? body.pickup_note.trim() : null,
      seller_name: body.seller_name.trim(),
      seller_contact: body.seller_contact.trim(),
    });

    req.files.forEach((file, idx) => marketLib.addItemImage(itemId, file.filename, idx));

    res.redirect(`/marketplace/${itemId}?posted=1`);
  });
});

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.DISTRICTS = DISTRICTS;
module.exports.categoryLabel = categoryLabel;
module.exports.conditionLabel = conditionLabel;
