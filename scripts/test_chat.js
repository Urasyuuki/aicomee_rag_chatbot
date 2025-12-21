async function testChat() {
  const question = "What is the vacation policy?";
  console.log(`Asking: "${question}"`);

  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Server Error Response:", errorData);
      throw new Error(`Chat failed: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Response:', data.response);
  } catch (err) {
    console.error('Error:', err);
  }
}

testChat();
