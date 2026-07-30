import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'text/plain', 'application/zip', 'application/x-zip-compressed'
];

const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  zip: 50 * 1024 * 1024,
};

const attachmentSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string().refine(val => VALID_FILE_TYPES.includes(val), { message: "Invalid file type" }),
  fileSize: z.number().refine(val => val > 0, { message: "File cannot be empty" }),
  url: z.string().url(),
  thumbnailUrl: z.string().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  duration: z.number().optional().nullable(),
}).refine(data => {
  if (data.mimeType.startsWith('image/')) return data.fileSize <= MAX_SIZES.image;
  if (data.mimeType.includes('zip')) return data.fileSize <= MAX_SIZES.zip;
  return data.fileSize <= MAX_SIZES.document;
}, { message: "File size exceeds limit" });

const startChatSchema = z.object({
  targetUserId: z.string().min(1),
  content: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine(data => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0), {
  message: "Message must contain either text content or at least one attachment",
});

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { targetUserId, content, attachments } = startChatSchema.parse(body);

    if (targetUserId === dbUser.id) {
      return new NextResponse("Cannot chat with yourself", { status: 400 });
    }

    // Verify connection exists and is accepted
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: dbUser.id, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: dbUser.id }
        ]
      }
    });

    if (!connection) {
      return new NextResponse("Must be connected to start a chat", { status: 403 });
    }

    // Check if room already exists
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: dbUser.id } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      }
    });

    if (!chatRoom) {
      // Create a new direct chat room
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: "DIRECT",
          participants: {
            create: [
              { userId: dbUser.id },
              { userId: targetUserId }
            ]
          }
        }
      });
    }

    // Create the message
    await prisma.message.create({
      data: {
        content: content || "",
        roomId: chatRoom.id,
        senderId: dbUser.id,
        seenBy: [dbUser.id],
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map(a => ({
            fileName: a.fileName,
            originalName: a.originalName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
            url: a.url,
            thumbnailUrl: a.thumbnailUrl,
            width: a.width,
            height: a.height,
            duration: a.duration,
            uploadedBy: dbUser.id,
            storageProvider: "CLOUDINARY"
          }))
        } : undefined
      }
    });

    return NextResponse.json({ roomId: chatRoom.id });
  } catch (error) {
    console.error("[CHAT_START_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}

