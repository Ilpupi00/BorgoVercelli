const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determina il percorso assoluto della directory uploads
// Funziona sia localmente che su Railway
const uploadDir = path.join(process.cwd(), 'src', 'public', 'uploads');

// Crea la directory se non esiste
if (!fs.existsSync(uploadDir)) {
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
