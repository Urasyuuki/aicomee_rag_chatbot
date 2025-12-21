async function testJP() {
  const q = "この画像には何が書いてありますか？特に危険なことについて教えて。";
  console.log(`Testing query: "${q}"`);
  
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: q }),
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Text:", text);
  } catch (e) {
    console.error(e);
  }
}

testJP();
