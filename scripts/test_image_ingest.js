const fs = require('fs');
const path = require('path');

async function uploadImage() {
  // Use the absolute path to the generated artifact
  const imagePath = "C:/Users/urara/.gemini/antigravity/brain/f85b1939-56d9-4678-8593-a1dc87619b9b/test_manual_1766344329186.png";
  
  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found:', imagePath);
    return;
  }

  const fileContent = fs.readFileSync(imagePath);
  const blob = new Blob([fileContent], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'test_manual.png');

  try {
    const res = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to upload: ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    console.log('Success:', data);
  } catch (err) {
    console.error('Error uploading image:', err);
  }
}

uploadImage();
