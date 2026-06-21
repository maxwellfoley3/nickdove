const fs = require('fs');
const path = require('path');

const collections = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/photoCollections.json'), 'utf-8')
);

module.exports = {
  eleventyComputed: {
    images: data => {
      const col = collections.find(c => c.id === data.collectionId);
      return col ? col.images : [];
    }
  }
};
