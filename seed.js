const fs = require('fs');
const path = require('path');
const { pool, initDB, setSetting, saveWriting, saveCollections } = require('./db');

async function seed() {
  console.log('Initializing database tables...');
  await initDB();

  const dataDir = path.join(__dirname, 'data');

  const authFile = path.join(dataDir, 'auth.json');
  if (fs.existsSync(authFile)) {
    const auth = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    await setSetting('password_hash', auth.passwordHash);
    console.log('Seeded password hash.');
  }

  const writingFile = path.join(dataDir, 'writing.json');
  if (fs.existsSync(writingFile)) {
    const writing = JSON.parse(fs.readFileSync(writingFile, 'utf-8'));
    await saveWriting(writing);
    console.log('Seeded ' + writing.length + ' writing entries.');
  }

  const collectionsFile = path.join(dataDir, 'photoCollections.json');
  if (fs.existsSync(collectionsFile)) {
    const collections = JSON.parse(fs.readFileSync(collectionsFile, 'utf-8'));
    await saveCollections(collections);
    console.log('Seeded ' + collections.length + ' photo collections.');
  }

  console.log('Done.');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
