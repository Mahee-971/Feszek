const express = require('express');
const router = express.Router();
const listingsLib = require('../lib/listings');
const paymentsLib = require('../lib/payments');
const barion = require('../lib/barion');

// Step 1: owner lands here right after submitting the listing form.
router.get('/pay/:id', async (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');
  if (listing.status !== 'awaiting_payment') {
    return res.redirect(`/pay/success/${listing.id}`);
  }

  try {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const result = await barion.startPayment({
      listingId: listing.id,
      payerEmail: listing.owner_email,
      publicBaseUrl,
    });
    paymentsLib.createPaymentRecord(listing.id, result.paymentId, 'pending');
    res.redirect(result.gatewayUrl);
  } catch (err) {
    res.status(500).render('error', { message: 'Could not start the payment. Please try again in a moment.', detail: err.message });
  }
});

// Demo-mode mock checkout (used only when BARION_POSKEY is not configured).
router.get('/pay/demo/:id', (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');
  res.render('pay_demo', { listing, paymentId: req.query.paymentId, fee: paymentsLib.LISTING_FEE_HUF });
});

router.post('/pay/demo/:id', (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');

  if (listing.status === 'awaiting_payment') {
    paymentsLib.markPaymentSucceeded(req.body.paymentId);
    listingsLib.markListingPaid(listing.id);
  }
  res.redirect(`/pay/success/${listing.id}`);
});

// Real Barion redirect target after the buyer finishes checkout.
router.get('/pay/return/:id', async (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');

  try {
    const payment = paymentsLib.getLatestPaymentForListing(listing.id);
    if (payment && listing.status === 'awaiting_payment') {
      const state = await barion.getPaymentState(payment.provider_payment_id);
      if (state.Status === 'Succeeded') {
        paymentsLib.markPaymentSucceeded(payment.provider_payment_id);
        listingsLib.markListingPaid(listing.id);
      } else if (state.Status === 'Failed' || state.Status === 'Canceled' || state.Status === 'Expired') {
        paymentsLib.markPaymentFailed(payment.provider_payment_id);
      }
    }
  } catch (err) {
    // fall through to success page which will show the current true status
  }
  res.redirect(`/pay/success/${listing.id}`);
});

// Barion server-to-server callback (real mode) - keeps status correct even
// if the buyer closes the tab before being redirected back.
router.post('/pay/callback', express.json(), async (req, res) => {
  try {
    const paymentId = req.body.PaymentId || req.query.paymentId;
    if (!paymentId) return res.sendStatus(400);
    const payment = paymentsLib.getPaymentByProviderId(paymentId);
    if (!payment) return res.sendStatus(404);

    const state = await barion.getPaymentState(paymentId);
    if (state.Status === 'Succeeded') {
      paymentsLib.markPaymentSucceeded(paymentId);
      listingsLib.markListingPaid(payment.listing_id);
    } else if (state.Status === 'Failed' || state.Status === 'Canceled' || state.Status === 'Expired') {
      paymentsLib.markPaymentFailed(paymentId);
    }
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get('/pay/success/:id', (req, res) => {
  const listing = listingsLib.getListingById(req.params.id);
  if (!listing) return res.status(404).render('not_found');
  res.render('pay_success', { listing });
});

module.exports = router;
