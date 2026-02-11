import { redis } from '@/lib/redis';
import { Elysia } from 'elysia';
import { nanoid } from 'nanoid';
import { authMiddleware } from './auth';
import z from 'zod';
import { realtime, TypeMessage } from '@/lib/realTime';
const ROOM_TTL_SECONDS = 60 * 10;
import { cors } from "@elysiajs/cors"

export const room = new Elysia({ prefix: '/room' })
    .post("/create", async () => {
        const roomId = nanoid();

        await redis.hset(`meta:${roomId}`, {
            connected: [],
            createdAt: Date.now(),

        })
        await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);
        return { roomId };
    }).use(authMiddleware).get("/ttl", async ({ auth }) => {
        const ttl = await redis.ttl(`meta:${auth.roomId}`);
        return { ttl: ttl < 0 ? 0 : ttl };
    }, { query: z.object({ roomId: z.string() }) }).delete('/', async ({ auth }) => {

        realtime.emit("chat.destroy", { isDestroyed: true });
        await Promise.all([
            redis.del(`meta:${auth.roomId}`),
            redis.del(auth.roomId),
            redis.del(`message:${auth.roomId}`)

        ])
    }, { query: z.object({ roomId: z.string() }) });

export const message = new Elysia({ prefix: "/message" }).use(authMiddleware).post('/', async ({ body, auth }) => {

    const { sender, text } = body;
    const { roomId } = auth;
    const existingRoom = await redis.exists(`meta:${roomId}`);
    if (!existingRoom) {
        throw new Error("Invalid roomID");
    }
    const message: TypeMessage = {
        id: nanoid(),
        sender,
        roomId,
        timestamp: Date.now(),
        text
    }
    await redis.rpush(`message:${roomId}`, { ...message, token: auth.authToken });

    realtime.channel(roomId).emit('chat.message', message);

    const expireTime = await redis.ttl(`meta:${roomId}`);
    await redis.expire(`history:${roomId}`, expireTime);
    await redis.expire(`message:${roomId}`, expireTime);
    await redis.expire(roomId, expireTime);

}, {
    body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000),
    })
}).get("/", async ({ auth }) => {
    const messages = await redis.lrange<TypeMessage>(`message:${auth.roomId}`, 0, -1);
    console.log(messages);

    return {
        messages: messages.map((msg) => (
            {
                ...msg,
                token: msg.token === auth.authToken ? msg.token : undefined
            }
        ))
    }
}, {
    query: z.object({
        roomId: z.string()
    })
})


export const app = new Elysia({ prefix: '/api/v1' }).use(
    cors({
        origin: 'https://real-time-chat-liart.vercel.app', // ← front‑end URL
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,          // send cookies / auth headers
        maxAge: 86400,              // cache pre‑flight for 1 day
    })
).use(room)
    .use(message)


export const GET = app.fetch
export const POST = app.fetch
export const DELETE = app.fetch
