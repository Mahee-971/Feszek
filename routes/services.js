const express = require('express');
const router = express.Router();
const servicesLib = require('../lib/services');

const SERVICE_TYPES = [
  { value: 'tutoring', label: 'Tutoring / lessons' },
  { value: 'roommate', label: 'Roommate wanted' },
  { value: 'part_time_job', label: 'Part-time job / gig' },
  { value: 'other', label: 'Other' },
];

const DISTRICTS = [
  'I. kerület', 'II. kerület', 'III. kerület', 'IV. kerület', 'V. kerület',
  'VI. kerület', 'VII. kerület', 'VIII. kerület', 'IX. kerület', 'X. kerület',
  'XI. kerület', 'XII. kerület', 'XIII. kerület', 'XIV. kerület', 'XV. kerület',
  'XVI. kerület', 'XVII. kerület', 'XVIII. kerület', 'XIX. kerület', 'XX. kerület',
  'XXI. kerület', 'XXII. kerület', 'XXIII. kerület',
];

function serviceTypeLabel(value) {
  const found = SERVICE_TYPES.find((c) => c.value === value);
  return found ? found.label : value;
}

router.get('/services', (req, res) => {
  const filters = {
    serviceType: req.query.serviceType || null,
    district: req.query.district || null,
  };
  const results = servicesLib.getActivePosts(filters);
  res.render('services_index', { results, filters, serviceTypes: SERVICE_TYPES, districts: DISTRICTS, serviceTypeLabel });
});

router.get('/services/post', (req, res) => {
  res.render('services_post', { serviceTypes: SERVICE_TYPES, districts: DISTRICTS, error: null, old: {} });
});

router.get('/services/:id', (req, res) => {
  const post = servicesLib.getPostById(req.params.id);
  if (!post || post.status !== 'active') return res.status(404).render('not_found');
  res.render('services_detail', { post, serviceTypeLabel, posted: req.query.posted === '1' });
});

router.post('/services/post', express.urlencoded({ extended: true }), (req, res) => {
  const formOpts = { serviceTypes: SERVICE_TYPES, districts: DISTRICTS };
  const body = req.body;
  const requiredFields = ['title', 'description', 'service_type', 'poster_name', 'poster_contact'];
  for (const f of requiredFields) {
    if (!body[f] || String(body[f]).trim() === '') {
      return res.render('services_post', { ...formOpts, error: `Please fill in "${f.replace('_', ' ')}".`, old: body });
    }
  }

  const postId = servicesLib.createPost({
    title: body.title.trim(),
    description: body.description.trim(),
    service_type: body.service_type,
    compensation_huf: body.compensation_huf ? parseInt(body.compensation_huf, 10) : null,
    district: body.district || null,
    poster_name: body.poster_name.trim(),
    poster_contact: body.poster_contact.trim(),
  });

  res.redirect(`/services/${postId}?posted=1`);
});

router.post('/services/:id/report', express.urlencoded({ extended: true }), (req, res) => {
  const post = servicesLib.getPostById(req.params.id);
  if (!post) return res.status(404).render('not_found');
  servicesLib.addReport(post.id, req.body.reason);
  res.render('reported', { title: post.title, backHref: '/services' });
});

module.exports = router;
module.exports.SERVICE_TYPES = SERVICE_TYPES;
module.exports.DISTRICTS = DISTRICTS;
module.exports.serviceTypeLabel = serviceTypeLabel;
