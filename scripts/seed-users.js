
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'admin@example.com', role: 'ADMIN' },
    { email: 'user@example.com', role: 'USER' },
    // 既存のlocalも残しておく
    { email: 'local@example.com', role: 'ADMIN' } 
  ];

  console.log('Seeding allowed users...');

  for (const u of users) {
    const user = await prisma.allowedUser.upsert({
        where: { email: u.email },
        update: { 
            role: u.role,
            isActive: true
        },
        create: {
            email: u.email,
            role: u.role,
            isActive: true
        },
    });
    console.log(`- ${user.email}: ${user.role}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
