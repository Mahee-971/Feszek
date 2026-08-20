// Seeds a handful of demo listings so the site looks real when previewing.
// Photos are generated placeholder images (see uploads/photos), not real
// apartment photos. Safe to delete: `rm db/data.sqlite*` and restart to
// reset to an empty board.
const db = require('./db');
const listings = require('../lib/listings');
const marketplace = require('../lib/marketplace');
const services = require('../lib/services');

const samples = [
  {
    title: 'Bright 2-room flat near Corvinus University',
    description: 'Sunny, freshly renovated 2-room apartment 5 minutes on foot from Corvinus University. Quiet courtyard-facing windows, fast wifi, washing machine. Great for students or a young couple.',
    listing_type: 'apartment',
    district: 'IX. kerület',
    address: 'Ráday utca 22',
    lat: 47.4869, lng: 19.0611,
    price_huf: 220000, rooms: 2, size_m2: 48,
    available_from: '2026-09-01', bills_included: 0, furnished: 1, pets_allowed: 0,
    owner_name: 'Katalin Nagy', owner_email: 'katalin.nagy@example.com', owner_phone: '+36 30 111 2233',
    photos: ['sample_1.jpg', 'sample_2.jpg', 'sample_3.jpg'],
  },
  {
    title: 'Cozy room in shared flat, District VII (Jewish Quarter)',
    description: 'Furnished room in a friendly 3-person shared flat in the heart of the party district. Perfect for exchange students. Bills included, high-speed internet, 2 min from ELTE tram line.',
    listing_type: 'room',
    district: 'VII. kerület',
    address: 'Kazinczy utca 14',
    lat: 47.4979, lng: 19.0625,
    price_huf: 110000, rooms: 1, size_m2: 14,
    available_from: '2026-09-15', bills_included: 1, furnished: 1, pets_allowed: 0,
    owner_name: 'Gábor Tóth', owner_email: 'gabor.toth@example.com', owner_phone: '+36 20 333 4455',
    photos: ['sample_4.jpg', 'sample_5.jpg'],
  },
  {
    title: 'Modern studio near BME (Műegyetem)',
    description: 'Newly built studio apartment on the Buda side, walking distance to BME. Elevator building, balcony, dishwasher. Ideal for a single student or young professional.',
    listing_type: 'apartment',
    district: 'XI. kerület',
    address: 'Bartók Béla út 41',
    lat: 47.4788, lng: 19.0505,
    price_huf: 195000, rooms: 1, size_m2: 32,
    available_from: '2026-09-01', bills_included: 0, furnished: 1, pets_allowed: 1,
    owner_name: 'Eszter Kovács', owner_email: 'eszter.kovacs@example.com', owner_phone: '+36 70 555 6677',
    photos: ['sample_6.jpg', 'sample_7.jpg', 'sample_8.jpg'],
  },
  {
    title: 'Spacious 3-room flat for flatmates, District XIII',
    description: 'Large apartment split into 3 rooms, currently 1 room available. Close to the river, tram 4/6, supermarkets nearby. Looking for a tidy, quiet flatmate.',
    listing_type: 'room',
    district: 'XIII. kerület',
    address: 'Pozsonyi út 30',
    lat: 47.5175, lng: 19.0567,
    price_huf: 130000, rooms: 1, size_m2: 16,
    available_from: '2026-10-01', bills_included: 1, furnished: 1, pets_allowed: 0,
    owner_name: 'Zoltán Horváth', owner_email: 'zoltan.horvath@example.com', owner_phone: '+36 30 777 8899',
    photos: ['sample_1.jpg', 'sample_3.jpg'],
  },
];

function run() {
  const existing = db.prepare(`SELECT COUNT(*) AS c FROM listings`).get().c;
  if (existing > 0) {
    console.log(`Database already has ${existing} listing(s) — skipping seed. Delete db/data.sqlite to reset.`);
    return;
  }

  samples.forEach((s) => {
    const id = listings.createDraftListing({
      title: s.title, description: s.description, listing_type: s.listing_type,
      district: s.district, address: s.address, lat: s.lat, lng: s.lng,
      price_huf: s.price_huf, rooms: s.rooms, size_m2: s.size_m2,
      available_from: s.available_from, bills_included: s.bills_included,
      furnished: s.furnished, pets_allowed: s.pets_allowed,
      owner_name: s.owner_name, owner_email: s.owner_email, owner_phone: s.owner_phone,
    });
    s.photos.forEach((f, idx) => listings.addListingImage(id, f, idx));
    listings.addIdDocument(id, 'demo_id_1.jpg');
    listings.markListingPaid(id);
    listings.publishListing(id);
  });

  console.log(`Seeded ${samples.length} demo listings (all published).`);
}

const marketSamples = [
  {
    title: 'IKEA desk, barely used',
    description: 'Moving out end of the semester, selling my IKEA desk (LINNMON/ADILS). No scratches, still has the original screws. Can help carry it down if you\'re nearby.',
    category: 'furniture', condition_label: 'like_new', is_free: 0, price_huf: 8000,
    district: 'IX. kerület', pickup_note: 'near Corvinus, easy pickup evenings',
    seller_name: 'Anna', seller_contact: '+36 30 111 2233', photos: ['swap_1.jpg'],
  },
  {
    title: 'Office chair - free, just come get it',
    description: 'Basic black office chair, works fine but has a small tear in the fabric on one side. Giving it away, just need it gone before I fly out.',
    category: 'furniture', condition_label: 'well_used', is_free: 1, price_huf: null,
    district: 'VII. kerület', pickup_note: 'Kazinczy utca, flexible timing',
    seller_name: 'Marco', seller_contact: 'marco.exchange@example.com', photos: ['swap_2.jpg'],
  },
  {
    title: 'Mountain bike, size M',
    description: 'Used it all semester to get around the city, works great, recently serviced. Selling because I\'m going back home and can\'t take it with me.',
    category: 'bikes', condition_label: 'used', is_free: 0, price_huf: 35000,
    district: 'XI. kerület', pickup_note: 'near BME',
    seller_name: 'Lucas', seller_contact: '+36 20 444 5566', photos: ['swap_3.jpg'],
  },
  {
    title: 'Mini fridge, perfect for a dorm room',
    description: 'Small fridge, fits perfectly under a desk. Clean, works perfectly, just don\'t need it where I\'m moving to next.',
    category: 'kitchen', condition_label: 'used', is_free: 0, price_huf: 15000,
    district: 'VIII. kerület', pickup_note: null,
    seller_name: 'Sofia', seller_contact: 'sofia.k@example.com', photos: ['swap_4.jpg'],
  },
  {
    title: 'Bookshelf, IKEA Billy',
    description: 'White Billy bookshelf, holds a lot more than it looks. A couple of small marks on top but sturdy and solid.',
    category: 'furniture', condition_label: 'used', is_free: 0, price_huf: 6000,
    district: 'XIII. kerület', pickup_note: 'near Pozsonyi út',
    seller_name: 'Jonas', seller_contact: '+36 70 777 8899', photos: ['swap_5.jpg'],
  },
  {
    title: 'Electric kettle - free',
    description: 'Works perfectly, just upgrading and don\'t need two. First come first served.',
    category: 'kitchen', condition_label: 'like_new', is_free: 1, price_huf: null,
    district: 'VI. kerület', pickup_note: null,
    seller_name: 'Emma', seller_contact: 'emma.erasmus@example.com', photos: ['swap_6.jpg'],
  },
];

function runMarketplace() {
  const existing = db.prepare(`SELECT COUNT(*) AS c FROM market_items`).get().c;
  if (existing > 0) {
    console.log(`Marketplace already has ${existing} item(s) — skipping seed.`);
    return;
  }
  marketSamples.forEach((s) => {
    const id = marketplace.createItem({
      title: s.title, description: s.description, category: s.category,
      condition_label: s.condition_label, is_free: s.is_free, price_huf: s.price_huf,
      district: s.district, pickup_note: s.pickup_note,
      seller_name: s.seller_name, seller_contact: s.seller_contact,
    });
    s.photos.forEach((f, idx) => marketplace.addItemImage(id, f, idx));
  });
  console.log(`Seeded ${marketSamples.length} demo marketplace items.`);
}

const serviceSamples = [
  {
    title: 'Math & physics tutoring, all levels',
    description: 'BME engineering student offering tutoring in math and physics, from high school through first-year university courses. Online or in person near BME.',
    service_type: 'tutoring', compensation_huf: 6000, district: 'XI. kerület',
    poster_name: 'Dávid', poster_contact: '+36 30 222 3344',
  },
  {
    title: 'Looking for a quiet roommate, XIII. kerület',
    description: '2-bedroom flat near the river, one room free from September. Looking for a tidy, quiet student or young professional. Bills included.',
    service_type: 'roommate', compensation_huf: null, district: 'XIII. kerület',
    poster_name: 'Petra', poster_contact: 'petra.flat@example.com',
  },
  {
    title: 'Weekend barista needed, cafe in District VII',
    description: 'Small specialty cafe looking for weekend help, Saturday and Sunday mornings. No experience required, we\'ll train you. Good for students.',
    service_type: 'part_time_job', compensation_huf: 2200, district: 'VII. kerület',
    poster_name: 'Café Lumen', poster_contact: 'jobs.lumen@example.com',
  },
  {
    title: 'English conversation practice, exchange for Hungarian lessons',
    description: 'Native English speaker looking to trade conversation practice for casual Hungarian lessons. Happy to meet weekly over coffee.',
    service_type: 'other', compensation_huf: null, district: null,
    poster_name: 'James', poster_contact: 'james.exchange@example.com',
  },
];

function runServices() {
  const existing = db.prepare(`SELECT COUNT(*) AS c FROM service_posts`).get().c;
  if (existing > 0) {
    console.log(`Jobs & Services already has ${existing} post(s) — skipping seed.`);
    return;
  }
  serviceSamples.forEach((s) => {
    services.createPost({
      title: s.title, description: s.description, service_type: s.service_type,
      compensation_huf: s.compensation_huf, district: s.district,
      poster_name: s.poster_name, poster_contact: s.poster_contact,
    });
  });
  console.log(`Seeded ${serviceSamples.length} demo jobs & services posts.`);
}

run();
runMarketplace();
runServices();
