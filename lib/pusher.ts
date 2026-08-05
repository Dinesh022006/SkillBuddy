import PusherServer from 'pusher';

const isDemo = 
  process.env.PUSHER_APP_ID === 'demo_app_id' || 
  process.env.PUSHER_KEY === 'demo_key' || 
  process.env.PUSHER_SECRET === 'demo_secret';

if (isDemo) {
  console.warn("Pusher is not configured. Replace the demo values in .env.local with your real Pusher credentials.");
}

export const pusherServer = (!isDemo && 
  process.env.PUSHER_APP_ID && 
  process.env.PUSHER_KEY && 
  process.env.PUSHER_SECRET && 
  process.env.PUSHER_CLUSTER
) ? new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
}) : null;

