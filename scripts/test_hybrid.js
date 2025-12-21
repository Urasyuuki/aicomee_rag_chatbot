async function testHybridChat() {
  const q1 = "What is the vacation policy?"; // Should be RAG
  const q2 = "What is the capital of France?"; // Should be General

  console.log("--- Testing RAG Question ---");
  await ask(q1);

  console.log("\n--- Testing General Question ---");
  await ask(q2);
}

async function ask(msg) {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.log("Error:", errorData);
        return;
    }
    const data = await res.json();
    console.log(`Q: "${msg}"`);
    console.log(`A: ${data.response.substring(0, 100)}...`); // Truncate for readability
    console.log(`Sources:`, data.sources);
  } catch (err) {
    console.error(err);
  }
}

testHybridChat();
