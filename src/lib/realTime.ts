import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import { redis } from "./redis";
import z from "zod";


const message = z.object({
    id: z.string(),
    sender: z.string(),
    text: z.string(),
    timestamp: z.number(),
    roomId: z.string(),
    token: z.string().optional(),

});

const schema = {
    chat: {
        message,

        destroy: z.object({
            isDestroyed: z.literal(true)
        })

    }
}

export const realtime = new Realtime({ schema: schema, redis: redis });
export type RealTimeEvent = InferRealtimeEvents<typeof realtime>;
export type TypeMessage = z.infer<typeof message>;