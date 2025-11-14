const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determina il percorso della directory uploads
// Su Railway: usa il volume montato su /data/uploads
// In locale: usa src/public/uploads per sviluppo
const uploadDir = process.env.RAILWAY_ENVIRONMENT 
  ? '/data/uploads' 
  : path.join(process.cwd(), 'src', 'public', 'uploads');

console.log('[MULTER] Upload directory:', uploadDir);

// Crea la directory se non esiste
if (!fs.existsSync(uploadDir)) {
  console.log('[MULTER] Creating upload directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

const squadraStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'squadra_' + Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi'), false);
  }
};

const uploadConfig = {
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
};

// Export per uso generale
const upload = multer({
  storage,
  ...uploadConfig
});

// Export per squadre (con prefisso nel nome file)
const uploadSquadra = multer({
  storage: squadraStorage,
  ...uploadConfig
});

module.exports = {
  upload,
  uploadSquadra,
  uploadDir
};
