const fs = require('fs');
const path = require('path');
const multer = require('multer');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const uploadsRoot = path.join(__dirname, '..', 'uploads', 'assignments');
const questionsDir = path.join(uploadsRoot, 'questions');
const submissionsDir = path.join(uploadsRoot, 'submissions');

ensureDirSync(questionsDir);
ensureDirSync(submissionsDir);

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg'
]);

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type'));
}

function createStorage(destinationDir) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destinationDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]+/g, '_');
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${base}-${unique}${ext}`);
    }
  });
}

const assignmentAttachmentsUpload = multer({
  storage: createStorage(questionsDir),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 10 }
});

const submissionFilesUpload = multer({
  storage: createStorage(submissionsDir),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 }
});

module.exports = {
  assignmentAttachmentsUpload,
  submissionFilesUpload,
};


