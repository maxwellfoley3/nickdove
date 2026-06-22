const express = require('express');
const nunjucks = require('nunjucks');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { DateTime } = require('luxon');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = '7d';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// --- Nunjucks ---

const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production'
});

env.addFilter('formatDate', function(dateInput, format) {
  format = format || 'MMMM yyyy';
  if (!dateInput) return '';
  let dt;
  if (dateInput instanceof Date) {
    dt = DateTime.fromJSDate(dateInput);
  } else if (typeof dateInput === 'string') {
    dt = DateTime.fromISO(dateInput, { zone: 'utc' });
    if (!dt.isValid) {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        dt = DateTime.fromFormat(dd + '-' + mm + '-' + yyyy, 'dd-MM-yyyy', { zone: 'utc' });
      }
    }
  }
  return dt && dt.isValid ? dt.toFormat(format) : String(dateInput);
});

app.set('view engine', 'njk');

// --- Auth ---

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

app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  const storedHash = await db.getSetting('password_hash');
  if (hashPassword(password) !== storedHash) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old and new passwords are required' });
  }
  const storedHash = await db.getSetting('password_hash');
  if (hashPassword(oldPassword) !== storedHash) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  await db.setSetting('password_hash', hashPassword(newPassword));
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ success: true, token });
});

// --- Writing routes ---

app.get('/api/writing', requireAuth, async (req, res) => {
  const writing = await db.getWriting();
  res.json(writing);
});

app.put('/api/writing', requireAuth, async (req, res) => {
  await db.saveWriting(req.body);
  res.json({ success: true });
});

// --- About/Contact routes ---

app.get('/api/about', requireAuth, async (req, res) => {
  const html = await db.getSetting('about_html');
  res.json({ html: html || '' });
});

app.put('/api/about', requireAuth, async (req, res) => {
  await db.setSetting('about_html', req.body.html);
  res.json({ success: true });
});

app.get('/api/contact', requireAuth, async (req, res) => {
  const html = await db.getSetting('contact_html');
  res.json({ html: html || '' });
});

app.put('/api/contact', requireAuth, async (req, res) => {
  await db.setSetting('contact_html', req.body.html);
  res.json({ success: true });
});

// --- Collection routes ---

app.get('/api/collections', requireAuth, async (req, res) => {
  const collections = await db.getCollections();
  res.json(collections);
});

app.put('/api/collections', requireAuth, async (req, res) => {
  await db.saveCollections(req.body);
  res.json({ success: true });
});

app.delete('/api/collections/:id', requireAuth, async (req, res) => {
  await db.deleteCollection(req.params.id);
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
        { folder: 'nickdove/' + collection, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.addPhoto(collection, result.secure_url, result.public_id);
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
    await db.removePhoto(publicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed: ' + err.message });
  }
});

// --- Static assets ---

app.use('/images', express.static(path.join(__dirname, 'src', 'images')));
app.use('/fonts', express.static(path.join(__dirname, 'src', 'fonts')));
app.use('/css', express.static(path.join(__dirname, 'src', 'css', 'dist')));

// --- Admin ---

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin', 'index.html'));
});

// --- Public pages ---

app.get('/', async (req, res) => {
  const collections = await db.getCollections();
  res.render('index', { photoCollections: collections.filter(c => c.featured), currentPath: '/' });
});

app.get('/writing/', async (req, res) => {
  const writing = await db.getWriting();
  writing.sort((a, b) => {
    const [dd1, mm1, yyyy1] = a.date.split('-');
    const [dd2, mm2, yyyy2] = b.date.split('-');
    return new Date(yyyy2, mm2 - 1, dd2) - new Date(yyyy1, mm1 - 1, dd1);
  });
  res.render('writing', { writing, currentPath: '/writing/' });
});

app.get('/about/', async (req, res) => {
  const aboutHtml = await db.getSetting('about_html');
  res.render('about', { currentPath: '/about/', aboutHtml });
});

app.get('/contact/', async (req, res) => {
  const contactHtml = await db.getSetting('contact_html');
  res.render('contact', { currentPath: '/contact/', contactHtml });
});

app.get('/photo/:id/', async (req, res) => {
  const col = await db.getCollection(req.params.id);
  if (!col) {
    const collections = await db.getCollections();
    return res.status(404).render('index', { photoCollections: collections.filter(c => c.featured), currentPath: '/' });
  }
  res.render('collection', {
    title: col.title,
    description: col.description,
    images: col.images,
    currentPath: '/photo/' + col.id + '/'
  });
});

// --- Start ---

db.initDB().then(() => {
  app.listen(PORT, () => {
    console.log('Server running at http://localhost:' + PORT);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
