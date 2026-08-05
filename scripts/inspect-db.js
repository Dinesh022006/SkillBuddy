const fs = require('fs');
const path = require('path');

// Simulate Prisma fetch directly to see raw JSON output of a real message with attachments
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.chatRoom.findFirst({
    where: { messages: { some: { attachments: { some: {} } } } }
  });
  
  if (!room) {
    console.log("No messages with attachments found in the database.");
    return;
  }
  
  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, clerkId: true } },
      attachments: true
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  console.log(JSON.stringify(messages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
