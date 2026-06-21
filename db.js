const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      published_by TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS photo_collections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      collection_id TEXT NOT NULL REFERENCES photo_collections(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      public_id TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);
}

// --- Settings ---

async function getSetting(key) {
  const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows.length ? rows[0].value : null;
}

async function setSetting(key, value) {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, value]
  );
}

// --- Writing ---

async function getWriting() {
  const { rows } = await pool.query(
    'SELECT id, date, title, published_by AS "publishedBy", url FROM writing ORDER BY sort_order ASC'
  );
  return rows;
}

async function saveWriting(entries) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM writing');
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      await client.query(
        'INSERT INTO writing (date, title, published_by, url, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [e.date, e.title, e.publishedBy, e.url, i]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// --- Photo Collections ---

async function getCollections() {
  const { rows: collections } = await pool.query(
    'SELECT id, title, description, featured, sort_order FROM photo_collections ORDER BY sort_order ASC'
  );
  for (const col of collections) {
    const { rows: photos } = await pool.query(
      'SELECT id, url, public_id AS "publicId" FROM photos WHERE collection_id = $1 ORDER BY sort_order ASC',
      [col.id]
    );
    col.images = photos;
  }
  return collections;
}

async function getCollection(id) {
  const { rows } = await pool.query(
    'SELECT id, title, description, featured FROM photo_collections WHERE id = $1',
    [id]
  );
  if (!rows.length) return null;
  const col = rows[0];
  const { rows: photos } = await pool.query(
    'SELECT id, url, public_id AS "publicId" FROM photos WHERE collection_id = $1 ORDER BY sort_order ASC',
    [col.id]
  );
  col.images = photos;
  return col;
}

async function saveCollections(collections) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < collections.length; i++) {
      const col = collections[i];
      await client.query(
        `INSERT INTO photo_collections (id, title, description, featured, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET title = $2, description = $3, featured = $4, sort_order = $5`,
        [col.id, col.title, col.description || '', col.featured || false, i]
      );
      if (col.images) {
        await client.query('DELETE FROM photos WHERE collection_id = $1', [col.id]);
        for (let j = 0; j < col.images.length; j++) {
          const img = col.images[j];
          await client.query(
            'INSERT INTO photos (collection_id, url, public_id, sort_order) VALUES ($1, $2, $3, $4)',
            [col.id, img.url, img.publicId || null, j]
          );
        }
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteCollection(id) {
  await pool.query('DELETE FROM photo_collections WHERE id = $1', [id]);
}

async function addPhoto(collectionId, url, publicId) {
  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM photos WHERE collection_id = $1',
    [collectionId]
  );
  const sortOrder = rows[0].next;
  const result = await pool.query(
    'INSERT INTO photos (collection_id, url, public_id, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
    [collectionId, url, publicId, sortOrder]
  );
  return result.rows[0].id;
}

async function removePhoto(publicId) {
  await pool.query('DELETE FROM photos WHERE public_id = $1', [publicId]);
}

module.exports = {
  pool,
  initDB,
  getSetting,
  setSetting,
  getWriting,
  saveWriting,
  getCollections,
  getCollection,
  saveCollections,
  deleteCollection,
  addPhoto,
  removePhoto
};
