// Barion Smart Gateway integration.
//
// Barion (https://www.barion.com) is a Hungarian payment provider with a
// well documented REST API and a free sandbox ("test") environment, which
// makes it a solid default for a small HUF-priced flat fee like this one.
//
// To go live:
//   1. Register a Barion account -> https://www.barion.com
//   2. Create a "Webshop" and copy its POSKey from the dashboard
//   3. Set these environment variables (see .env.example):
//        BARION_POSKEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//        BARION_ENV=production        (or "test" while testing)
//        BARION_PIXEL_ID=            (optional)
//        PUBLIC_BASE_URL=https://your-deployed-domain.com
//
// Until BARION_POSKEY is set, the app runs in DEMO MODE: the payment step
// shows an on-site mock checkout screen instead of redirecting to Barion,
// so the rest of the flow (publish, review, browse) can be tested end to
// end with no merchant account. Nothing fake ever gets marked "published"
// without going through this same paid_pending_review -> admin approval path.

const fetch = require('node-fetch');
const { LISTING_FEE_HUF } = require('./payments');

const POSKEY = process.env.BARION_POSKEY || '';
const ENV = (process.env.BARION_ENV || 'test').toLowerCase();
const BASE_URL = ENV === 'production'
  ? 'https://api.barion.com'
  : 'https://api.test.barion.com';

const DEMO_MODE = !POSKEY;

async function startPayment({ listingId, payerEmail, publicBaseUrl }) {
  if (DEMO_MODE) {
    // Simulated payment id; the on-site demo checkout page uses this.
    const fakePaymentId = `DEMO-${listingId}-${Date.now()}`;
    return {
      demo: true,
      paymentId: fakePaymentId,
      gatewayUrl: `/pay/demo/${listingId}?paymentId=${fakePaymentId}`,
    };
  }

  const payload = {
    POSKey: POSKEY,
    PaymentType: 'Immediate',
    GuestCheckout: true,
    FundingSources: ['All'],
    PaymentRequestId: `listing-${listingId}-${Date.now()}`,
    RedirectUrl: `${publicBaseUrl}/pay/return/${listingId}`,
    CallbackUrl: `${publicBaseUrl}/pay/callback`,
    Transactions: [
      {
        POSTransactionId: `TXN-${listingId}-${Date.now()}`,
        Payee: process.env.BARION_PAYEE_EMAIL || payerEmail,
        Total: LISTING_FEE_HUF,
        Comment: `Fészek - publish listing #${listingId}`,
        Items: [
          {
            Name: 'Apartment listing publication fee',
            Description: `One-time fee to publish listing #${listingId}`,
            Quantity: 1,
            Unit: 'pcs',
            UnitPrice: LISTING_FEE_HUF,
            ItemTotal: LISTING_FEE_HUF,
          },
        ],
      },
    ],
    Currency: 'HUF',
    Locale: 'en-US',
  };

  const res = await fetch(`${BASE_URL}/v2/Payment/Start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok || data.Errors?.length) {
    throw new Error('Barion payment start failed: ' + JSON.stringify(data.Errors || data));
  }

  return {
    demo: false,
    paymentId: data.PaymentId,
    gatewayUrl: data.GatewayUrl,
  };
}

async function getPaymentState(paymentId) {
  if (DEMO_MODE || String(paymentId).startsWith('DEMO-')) {
    // Caller handles demo state transitions itself via the mock checkout route.
    return { Status: 'Unknown', demo: true };
  }
  const url = `${BASE_URL}/v2/Payment/GetPaymentState?POSKey=${POSKEY}&PaymentId=${paymentId}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

module.exports = { startPayment, getPaymentState, DEMO_MODE };
