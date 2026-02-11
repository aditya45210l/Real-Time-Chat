'use client'

import { client } from "@/lib/client";
import { useUserName } from "@/lib/hooks/use-userName";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Page = () => {
    console.log("i am rendring again and again ")
    const { username } = useUserName();
    const [copyStatus, setCopyStatus] = useState("COPY");
    const [input, setInput] = useState<string>('');
    const [timeRemaning, setTimeRemaning] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const param = useParams();
    const roomId = param.roomId as string;
    const { data: timeToLive } = useQuery({
        queryKey: ["ttl"],
        queryFn: async () => {
            const ttl = await client.v1.room.ttl.get({ query: { roomId } });
            return ttl.data;
        }
    })

    useEffect(() => {
        // if (timeToLive?.ttl !== undefined) {
        //     setTimeRemaning(timeToLive?.ttl);
        // }
    }, [timeToLive]);

    useEffect(() => {
        if (timeRemaning == null || timeRemaning <= 0) return;
        if (timeRemaning === 0) {
            router.push("/?destroy=true");
        }
        const interval = setInterval(() => {
            setTimeRemaning((prvs) => {
                if (prvs === null || prvs <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                console.log("prvs: ", prvs)
                return prvs - 1
            })

            return () => clearInterval(interval)
        }, 1000);

    }, [timeToLive])

    const { data: messages, refetch } = useQuery(
        {
            queryKey: ["messages", roomId],
            queryFn: async () => {
                const res = await client.v1.message.get({ query: { roomId } });
                return res.data;
            }
        }
    )
    useRealtime({
        channels: [roomId],
        events: ["chat.message", "chat.destroy"],
        onData: ({ data, event }) => {
            console.log("data: ", data);
            refetch();
        }
    })


    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopyStatus("COPIED");
        setTimeout(() => {
            setCopyStatus("COPY")
        }, 500);
    }
    const formateTimeRemaning = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${min}:${secs.toString().padStart(2, "0")}`
    }


    const { mutate: deleteRoom } = useMutation({
        mutationKey: ["deleteRoom"],
        mutationFn: async () => {
            console.log("i am called")
            await client.v1.room.delete(null, { query: { roomId } });
            router.push('/?destroy=true');
        }
    })


    const { mutate: handleSendMessage, isPending } = useMutation({
        mutationFn: async ({ message }: { message: string }) => {
            const res = await client.v1.message.post({
                sender: username,
                text: message,
            }, { query: { roomId: roomId } })
            return res;
        }
    })


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);


    return (
        <main className="flex flex-col h-screen max-h-screen overflow-hidden ">
            <header className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-zinc-500 uppercase ">Room id</span>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">{roomId}</span>
                            <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer" onClick={() => copyLink()}>
                                {copyStatus}
                            </button>
                        </div>
                    </div>
                    <div className="h-8 w-px  bg-zinc-800 " />
                    <div className="flex flex-col">
                        <span className="text-sm text-zinc-500 uppercase">
                            Self-Destruct
                        </span>
                        <span className={`text-sm flex items-center font-bold gap-2 ${timeRemaning !== null && timeRemaning < 60 ? "text-red-500" : "text-amber-500"}`}>{timeRemaning !== null ? formateTimeRemaning(timeRemaning) : "--:--"}</span>
                    </div>

                </div>
                <div className="flex items-center">
                    <button onClick={() => deleteRoom()} className="flex items-center justify-center gap-3 text-sm text-zinc-200 hover:text-zinc-100 font-bold bg-zinc-800 hover:bg-red-500 rounded px-3 py-1.5 uppercase transition-all cursor-pointer disabled:opacity-50">
                        <span className="animate-pulse" >💣</span>
                        destroy now</button>
                </div>
            </header>

            <div className="flex-1 scrollbar-thin overflow-y-auto p-4 space-y-4">
                {messages?.messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <span className="text-zinc-600">No Messages,yet start the conversation.</span>
                    </div>
                )}
                {
                    messages?.messages.map((msg) => {
                        return <div key={msg.id} className="flex justify-center max-w-[80%] flex-col">
                            <div className="flex flex-row gap-2 items-center">
                                <span className={`text-sm ${msg.sender === username ? "text-green-500" : "text-blue-500"}`}>
                                    {msg.sender === username ? "YOU" : msg.sender}
                                </span>
                                <span className="text-zinc-400 text-sm">
                                    {format(msg.timestamp, "HH:mm")}
                                </span>
                            </div>
                            <p className="text-zinc-200">
                                {msg.text}
                            </p>
                        </div>
                    })
                }
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-zinc-800 p-4 bg-zinc-900/30">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 ">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500  animate-pulse">{">"}</span>
                        <input
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                            }}
                            onKeyDown={async (e) => {
                                if (e.key === "Enter" && input.trim()) {
                                    await handleSendMessage({ message: input.trim() });
                                    // todo
                                    inputRef.current?.focus();
                                    setInput("");

                                }
                            }} ref={inputRef} type="text" className="pl-8 w-full focus:border-zinc-700 border  border-zinc-800 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 text-sm" placeholder="name" autoFocus />
                    </div>
                    <button
                        disabled={isPending || !input.trim()}
                        onClick={async () => {
                            await handleSendMessage({ message: input.trim() })
                            inputRef.current?.focus();
                            setInput("");
                        }} className="uppercase text-sm border border-zinc-800 text-zinc-400 px-6 py-3 bg-zinc-800 font-bold cursor-pointer hover:text-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 ">send</button>
                </div>

            </div>
        </main >
    )
}

export default Page