async function testBrief() {
  const q = "こんにちは";
  console.log(`Testing query: "${q}"`);
  
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: q }),
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.log("Error Response:", text);
        return;
    }

    const data = await res.json();
    console.log("Response:", data.response);
  } catch (e) {
    console.error(e);
  }
}

testBrief();
