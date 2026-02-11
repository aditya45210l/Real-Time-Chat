"use client"

import { createRealtime } from "@upstash/realtime/client"
import type { RealTimeEvent } from "./realTime"

export const { useRealtime } = createRealtime<RealTimeEvent>()