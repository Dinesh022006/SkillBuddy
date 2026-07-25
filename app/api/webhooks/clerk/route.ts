import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, last_sign_in_at } = evt.data;
    const email = email_addresses[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(' ');

    if (!email) {
      return new Response('No email provided', { status: 400 });
    }

    const userData = {
      clerkId: id,
      email,
      firstName: first_name || '',
      lastName: last_name || '',
      fullName,
      name: fullName,
      avatarUrl: image_url,
      imageUrl: image_url,
      lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : new Date(),
    };

    await prisma.user.upsert({
      where: { clerkId: id },
      update: userData,
      create: {
        ...userData,
        profile: {
          create: {}
        }
      }
    });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (id) {
      // Soft delete
      await prisma.user.update({
        where: { clerkId: id },
        data: { deletedAt: new Date() }
      }).catch((e) => console.error("User not found for deletion", e));
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
