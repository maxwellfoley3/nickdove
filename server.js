const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = '7d';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const AUTH_FILE = path.join(__dirname, 'data', 'auth.json');

function getPasswordHash() {
  return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8')).passwordHash;
}

function setPasswordHash(hash) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: hash }, null, 2));
}

app.use(express.json());

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Auth routes ---

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (hashPassword(password) !== getPasswordHash()) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old and new passwords are required' });
  }
  if (hashPassword(oldPassword) !== getPasswordHash()) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  setPasswordHash(hashPassword(newPassword));
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ success: true, token });
});

// --- Data routes ---

const DATA_DIR = path.join(__dirname, 'data');

app.get('/api/data/:collection', requireAuth, (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.collection}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(data);
});

app.put('/api/data/:collection', requireAuth, (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// --- Photo routes ---

app.post('/api/photos/upload', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  const collection = req.body.collection;
  if (!collection) {
    return res.status(400).json({ error: 'Collection name required' });
  }
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `nickdove/${collection}`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

app.delete('/api/photos', requireAuth, async (req, res) => {
  const publicId = req.query.publicId;
  if (!publicId) {
    return res.status(400).json({ error: 'publicId query parameter required' });
  }
  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed: ' + err.message });
  }
});

// --- Serve static site ---

app.use(express.static(path.join(__dirname, '_site')));

app.get('/{*splat}', (req, res) => {
  const filePath = path.join(__dirname, '_site', req.path, 'index.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).sendFile(path.join(__dirname, '_site', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
