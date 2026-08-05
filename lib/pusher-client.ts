import PusherClient from 'pusher-js';

const isDemo = process.env.NEXT_PUBLIC_PUSHER_KEY === 'demo_key';

if (isDemo) {
  console.warn("Pusher is not configured. Replace the demo values in .env.local with your real Pusher credentials.");
}

export const pusherClient = (!isDemo && 
  process.env.NEXT_PUBLIC_PUSHER_KEY && 
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) ? new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    authEndpoint: '/api/pusher/auth',
  }
) : null;

