const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const listingsLib = require('../lib/listings');
const { DISTRICTS } = require('./public');
const { PHOTOS_DIR, ID_CARDS_DIR } = require('../lib/paths');

// Photos and ID docs arrive in the same multipart form but need to land in
// different folders, so a single multer instance routes by fieldname.
const multerCombined = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === 'idDocs' ? ID_CARDS_DIR : PHOTOS_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'photos', maxCount: 8 },
  { name: 'idDocs', maxCount: 2 },
]);

router.post('/list-your-place', (req, res) => {
  multerCombined(req, res, (err) => {
    if (err) {
      return res.render('submit', { districts: DISTRICTS, error: err.message, old: req.body });
    }

    const body = req.body;
    const requiredFields = ['title', 'description', 'address', 'district', 'price_huf',
      'owner_name', 'owner_email', 'owner_phone'];
    for (const f of requiredFields) {
      if (!body[f] || String(body[f]).trim() === '') {
        return res.render('submit', { districts: DISTRICTS, error: `Please fill in "${f.replace('_', ' ')}".`, old: body });
      }
    }
    if (!req.files || !req.files.photos || req.files.photos.length === 0) {
      return res.render('submit', { districts: DISTRICTS, error: 'Please upload at least one photo of the place.', old: body });
    }
    if (!req.files.idDocs || req.files.idDocs.length === 0) {
      return res.render('submit', { districts: DISTRICTS, error: 'Please upload a photo/scan of your ID card so we can verify you as the owner.', old: body });
    }

    const listingId = listingsLib.createDraftListing({
      title: body.title.trim(),
      description: body.description.trim(),
      listing_type: body.listing_type === 'room' ? 'room' : 'apartment',
      district: body.district,
      address: body.address.trim(),
      lat: body.lat ? parseFloat(body.lat) : null,
      lng: body.lng ? parseFloat(body.lng) : null,
      price_huf: parseInt(body.price_huf, 10),
      rooms: body.rooms ? parseFloat(body.rooms) : null,
      size_m2: body.size_m2 ? parseInt(body.size_m2, 10) : null,
      available_from: body.available_from || null,
      bills_included: body.bills_included ? 1 : 0,
      furnished: body.furnished ? 1 : 0,
      pets_allowed: body.pets_allowed ? 1 : 0,
      owner_name: body.owner_name.trim(),
      owner_email: body.owner_email.trim(),
      owner_phone: body.owner_phone.trim(),
    });

    req.files.photos.forEach((file, idx) => {
      listingsLib.addListingImage(listingId, file.filename, idx);
    });
    req.files.idDocs.forEach((file) => {
      listingsLib.addIdDocument(listingId, file.filename);
    });

    res.redirect(`/pay/${listingId}`);
  });
});

module.exports = router;
