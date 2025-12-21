


async function testDelete() {
    const baseUrl = 'http://127.0.0.1:3000';
    
    // 1. Create a new dummy conversation (by sending a message to /api/chat if needed, OR explicit creation?)
    // The app creates conversation implicitly via chat or implicitly in frontend state. 
    // But backing DB creation happens on first message.
    // However, sidebar lists conversations from DB.
    // Let's check if we can create one via DB if possible, but we don't have direct DB access easily in JS script without prisma client setup.
    // Let's use the API flow: Send a message to create a conv.
    
    console.log("1. Creating conversation...");
    const convId = "test-delete-" + Date.now();
    const resChat = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hello Delete Test", conversationId: convId })
    });
    
    if (resChat.status !== 200 && resChat.status !== 429) { // 429 is possible but creation might happen before response? 
        // Actually route.ts creates conversation BEFORE generating response/checking limit?
        // Let's check route.ts. Upsert happens before RAG.
        // So even if 429, DB entry might be created.
        console.log("Chat status:", resChat.status);
    }
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));
    
    // 2. Verify it exists
    console.log("2. Verifying existence...");
    const resList = await fetch(`${baseUrl}/api/conversations`);
    const dataList = await resList.json();
    const found = dataList.conversations.find(c => c.id === convId);
    
    if (!found) {
        console.error("Conversation not created!");
        return;
    }
    console.log("Conversation found:", found.id);
    
    // 3. Delete it
    console.log("3. Deleting...");
    const resDelete = await fetch(`${baseUrl}/api/conversations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convId })
    });
    
    const deleteData = await resDelete.json();
    console.log("Delete response:", resDelete.status, deleteData);
    
    // 4. Verify gone
    console.log("4. Verifying deletion...");
    const resList2 = await fetch(`${baseUrl}/api/conversations`);
    const dataList2 = await resList2.json();
    const found2 = dataList2.conversations.find(c => c.id === convId);
    
    if (found2) {
        console.error("FAILED: Conversation still exists!");
    } else {
        console.log("SUCCESS: Conversation deleted.");
    }
}

testDelete().catch(console.error);
