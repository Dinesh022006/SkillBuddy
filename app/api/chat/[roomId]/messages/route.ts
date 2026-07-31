import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
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

const messageSchema = z.object({
  content: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine(data => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0), {
  message: "Message must contain either text content or at least one attachment",
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { content, attachments } = messageSchema.parse(body);

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true }
    });

    if (!room) return new NextResponse("Room not found", { status: 404 });

    const isParticipant = room.participants.some(p => p.userId === dbUser.id);
    if (!isParticipant) {
      return new NextResponse("Not a participant", { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content: content || "",
        roomId: roomId,
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
            storageProvider: "VERCEL_BLOB"
          }))
        } : undefined
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, clerkId: true }
        },
        attachments: true
      }
    });

    if (pusherServer) {
      try {
        await pusherServer.trigger(`room-${roomId}`, 'new-message', message);
      } catch (pusherError) {
        console.warn("[PUSHER] Failed to trigger event:", pusherError);
      }
    } else {
      console.warn("[PUSHER] Realtime messaging is disabled due to missing configuration.");
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true }
    });

    if (!room) return new NextResponse("Room not found", { status: 404 });

    const isParticipant = room.participants.some(p => p.userId === dbUser.id);
    if (!isParticipant) {
      return new NextResponse("Not a participant", { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { roomId: roomId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, clerkId: true } },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
