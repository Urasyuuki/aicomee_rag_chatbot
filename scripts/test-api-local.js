// scripts/test-api-local.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
    try {
        console.log('Testing Prisma connection...');
        const docs = await prisma.document.findMany();
        console.log('Prisma connection successful. Documents:', docs.length);
    } catch (e) {
        console.error('Prisma connection failed:', e);
    }
}

testPrisma();
