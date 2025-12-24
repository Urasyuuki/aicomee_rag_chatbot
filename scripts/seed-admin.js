
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'local@example.com'; // テスト用アカウント
  
  // 既存なら更新、なければ作成
  const user = await prisma.allowedUser.upsert({
    where: { email: adminEmail },
    update: { 
        role: 'ADMIN',
        isActive: true
    },
    create: {
      email: adminEmail,
      role: 'ADMIN',
      isActive: true
    },
  });

  console.log(`Admin user seeded: ${user.email} (Role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
