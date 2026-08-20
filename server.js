require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const { PHOTOS_DIR } = require('./lib/paths');
require('./db/db'); // ensures schema is created on boot

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Listing photos are public by design. ID card scans are NEVER mounted here.
app.use('/uploads/photos', express.static(PHOTOS_DIR));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 },
}));

app.use((req, res, next) => {
  res.locals.feeHuf = process.env.LISTING_FEE_HUF || 500;
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  next();
});

app.use(require('./routes/public'));
app.use(require('./routes/listing_submit'));
app.use(require('./routes/payment'));
app.use(require('./routes/marketplace'));
app.use(require('./routes/services'));
app.use(require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('not_found');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Something went wrong.', detail: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fészek running on http://localhost:${PORT}`);
});
