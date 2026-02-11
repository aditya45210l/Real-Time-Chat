import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";


export async function proxy(req: NextRequest) {
    const pathName = req.nextUrl.pathname;
    const match = pathName.match(/^\/room\/([^/]+)$/);
    if (!match) {
        return NextResponse.redirect(new URL("/", req.url));
    }
    const meta = await redis.hgetall<{ connected: [string], createdAt: number }>(`meta:${match[1]}`);
    if (!meta) {
        return NextResponse.redirect(new URL("/?error=invalid-room-id", req.url))
    }
    const existingToken = req.cookies.get("x-auth-token")?.value;
    if (existingToken && meta.connected.includes(existingToken)) {
        return NextResponse.next();
    }
    if (meta.connected.length >= 2) {
        return NextResponse.redirect(new URL("/?error=room-is-full", req.url));
    }

    const response = NextResponse.next();
    const token = nanoid();
    response.cookies.set("x-auth-token", token, {
        httpOnly: true,
        path: '/',
        sameSite: 'strict'
    });

    redis.hset(`meta:${match[1]}`, {
        connected: [...meta.connected, token]
    })

    return response;
}

export const config = {
    matcher: '/room/:path*',
}