import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { VALID_FILE_TYPES, MAX_SIZES } from '@/lib/utils/upload';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await currentUser();
        if (!user) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: [
            ...VALID_FILE_TYPES.image,
            ...VALID_FILE_TYPES.document,
            ...VALID_FILE_TYPES.zip
          ],
          maximumSizeInBytes: Math.max(MAX_SIZES.image, MAX_SIZES.document, MAX_SIZES.zip), // 50MB is our absolute max
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } 
    );
  }
}
