async function testAll() {
  const scenarios = [
    { q: "What is the vacation policy?", type: "RAG (EN)" },
    { q: "休暇の規定はについて教えて", type: "RAG (JP)" },
    { q: "What is the capital of France?", type: "General (EN)" },
    { q: "フランスの首都は？", type: "General (JP)" },
    { q: "こんにちは", type: "General (JP Greetings)" }
  ];

  for (const s of scenarios) {
    console.log(`\n--- Testing ${s.type} ---`);
    await ask(s.q);
  }
}

async function ask(msg) {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) {
        console.log("Error Status:", res.status);
        return;
    }
    const data = await res.json();
    console.log(`Q: "${msg}"`);
    console.log(`A: ${data.response.substring(0, 100).replace(/\n/g, ' ')}...`); 
    console.log(`Sources:`, data.sources);
  } catch (err) {
    console.error(err);
  }
}

testAll();
