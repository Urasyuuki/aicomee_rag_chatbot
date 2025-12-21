async function testContent() {
  const source = "galaxy_handbook.md";
  console.log(`Testing content retrieval for: "${source}"`);
  
  try {
    const res = await fetch('http://localhost:3000/api/documents/content', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ source }),
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    
    if (res.ok) {
        console.log("Content Length:", data.content.length);
        console.log("Snippet:", data.content.substring(0, 100).replace(/\n/g, ' '));
    } else {
        console.error("Error:", data);
    }
  } catch (e) {
    console.error(e);
  }
}

testContent();
