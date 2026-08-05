import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 20;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "images";
    const cursor = searchParams.get("cursor");
    const q = searchParams.get("q")?.toLowerCase();

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: dbUser.id,
        },
      },
    });

    if (!isParticipant) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (type === "links") {
      const messages = await prisma.message.findMany({
        where: {
          roomId: roomId,
          content: {
            contains: "http",
          },
        },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      });

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let links: any[] = [];
      
      for (const msg of messages) {
        const matches = msg.content.match(urlRegex);
        if (matches) {
          for (const match of matches) {
            if (!q || match.toLowerCase().includes(q) || msg.sender.name?.toLowerCase().includes(q)) {
              let domain = match;
              try {
                const urlObj = new URL(match);
                domain = urlObj.hostname;
              } catch (e) {}
              
              links.push({
                id: `${msg.id}-${match}`,
                url: match,
                domain: domain,
                messageId: msg.id,
                uploadedBy: msg.sender,
                createdAt: msg.createdAt,
              });
            }
          }
        }
      }

      let paginatedLinks = links;
      if (cursor) {
        const cursorIndex = links.findIndex(l => l.id === cursor);
        if (cursorIndex !== -1) {
          paginatedLinks = links.slice(cursorIndex + 1);
        }
      }
      const finalLinks = paginatedLinks.slice(0, LIMIT);
      let nextCursor = null;
      if (paginatedLinks.length > LIMIT) {
        nextCursor = finalLinks[finalLinks.length - 1].id;
      }

      return NextResponse.json({
        items: finalLinks,
        nextCursor,
      });
    } else {
      let mimeTypeFilter: any = {};

      if (type === "images") mimeTypeFilter = { startsWith: "image/" };
      else if (type === "videos") mimeTypeFilter = { startsWith: "video/" };
      else if (type === "voice") mimeTypeFilter = { startsWith: "audio/" };
      else if (type === "documents") {
        mimeTypeFilter = {
          not: {
            OR: [
              { startsWith: "image/" },
              { startsWith: "video/" },
              { startsWith: "audio/" }
            ]
          }
        };
      }

      let queryFilter: any = {
        message: { roomId: roomId },
        mimeType: mimeTypeFilter,
      };

      if (q) {
        queryFilter = {
          ...queryFilter,
          OR: [
            { fileName: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        };
      }

      const attachments = await prisma.attachment.findMany({
        where: queryFilter,
        take: LIMIT + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      let nextCursor = null;
      if (attachments.length > LIMIT) {
        attachments.pop(); // remove the extra item
        nextCursor = attachments[attachments.length - 1].id;
      }

      return NextResponse.json({
        items: attachments,
        nextCursor,
      });
    }
  } catch (error) {
    console.error("[MEDIA_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
