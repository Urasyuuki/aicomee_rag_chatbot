const fs = require('fs');
const path = require('path');

async function uploadFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const blob = new Blob([fileContent], { type: 'text/markdown' });
  const formData = new FormData();
  formData.append('file', blob, filename);

  try {
    const res = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to upload ${filename}: ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    console.log(`Success (${filename}):`, data);
  } catch (err) {
    console.error(`Error seeding ${filename}:`, err);
  }
}

async function seed() {
    await uploadFile('dummy_manual.md');
    await uploadFile('galaxy_handbook.md');
}

seed();
