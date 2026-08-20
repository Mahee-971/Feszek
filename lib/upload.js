const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PHOTOS_DIR, ID_CARDS_DIR } = require('./paths');

function makeStorage(destination) {
  return multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const imageFileFilter = (req, file, cb) => {
  const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only JPG, PNG or WEBP images are allowed'), ok);
};

const idFileFilter = (req, file, cb) => {
  const ok = ['.jpg', '.jpeg', '.png', '.pdf'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only JPG, PNG or PDF files are allowed'), ok);
};

const uploadPhotos = multer({
  storage: makeStorage(PHOTOS_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

const uploadIdDocs = multer({
  storage: makeStorage(ID_CARDS_DIR),
  fileFilter: idFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
});

module.exports = { uploadPhotos, uploadIdDocs };
