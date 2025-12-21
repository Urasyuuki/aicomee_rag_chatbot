
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function testPrisma() {
    console.log("Testing Prisma...");
    const prisma = new PrismaClient();
    try {
        const count = await prisma.document.count();
        console.log("Prisma connection successful. Document count:", count);
    } catch (e) {
        console.error("Prisma connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

async function testVectorStore() {
    console.log("Testing Vector Store read...");
    try {
        const p = path.join(process.cwd(), 'vector_store.json');
        if (fs.existsSync(p)) {
            const data = fs.readFileSync(p, 'utf-8');
            JSON.parse(data);
            console.log("Vector store JSON is valid.");
        } else {
            console.log("Vector store file not found (this might be ok if empty).");
        }
    } catch (e) {
        console.error("Vector store read failed:", e);
    }
}

async function run() {
    await testPrisma();
    await testVectorStore();
}

run();
