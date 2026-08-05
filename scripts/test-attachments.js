const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attachments = await prisma.attachment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(attachments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
