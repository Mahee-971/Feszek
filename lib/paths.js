// Centralizes where persistent data (the SQLite db + uploaded files) lives,
// so it can all be redirected to one mounted volume in production by
// setting a single DATA_DIR environment variable.
//
// Locally / by default, DATA_DIR is the project root, so nothing changes
// from a plain `npm start` with no env vars set.
//
// On a host that gives you one persistent volume (e.g. Railway), mount that
// volume at some path like /data and set DATA_DIR=/data in the environment
// — the db and every upload then live on the volume and survive redeploys.

const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');

const DB_DIR = path.join(DATA_DIR, 'db');
const DB_PATH = path.join(DB_DIR, 'data.sqlite');

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PHOTOS_DIR = path.join(UPLOADS_DIR, 'photos');
const ID_CARDS_DIR = path.join(UPLOADS_DIR, 'id_cards');

// Make sure every persistent folder exists before anything tries to read
// or write to it (a fresh empty volume won't have them yet).
[DB_DIR, PHOTOS_DIR, ID_CARDS_DIR].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

module.exports = { DATA_DIR, DB_DIR, DB_PATH, UPLOADS_DIR, PHOTOS_DIR, ID_CARDS_DIR };
