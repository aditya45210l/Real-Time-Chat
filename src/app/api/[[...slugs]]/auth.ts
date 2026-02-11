import Elysia from "elysia";
import { room } from "./route";
import { redis } from "@/lib/redis";


class AuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuthError";
    }
}


export const authMiddleware = new Elysia({ name: 'auth' }).error({ AuthError }).onError(({ code, set }) => {
    if (code === "AuthError") {
        set.status = 401;
        return { error: "Unauthorised" }
    }
}).derive({ as: "scoped" }, async ({ query, cookie }) => {
    const roomId = query.roomId;
    const authToken = cookie["x-auth-token"].value as string;

    if (!room || !authToken) {
        throw new AuthError("Missing roomId or Token.");
    }

    const connected = await redis.hget<string[]>(`meta:${roomId}`, "connected");

    if (!connected?.includes(authToken)) {
        throw new AuthError("Invalid Token.");
    }

    return { auth: { roomId, connected, authToken } }
})