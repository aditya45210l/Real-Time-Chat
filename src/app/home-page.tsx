'use client'
import { client } from "@/lib/client";
import { useUserName } from "@/lib/hooks/use-userName";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";


export default function HomePage() {
  const { username } = useUserName();
  const router = useRouter()
  const searchParam = useSearchParams();

  const isdestroyed = searchParam.get("destroy") === "true"
  const isError = searchParam.get("error");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.v1.room.create.post();
      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);

      }
    }
  })


  return (
    <main className="flex min-h-screen flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        {isdestroyed && <div className="py-4 border border-red-800/50 bg-red-950/50 text-center">
          <span className="text-red-400">ROOM DESTROYED</span>
          <p className="text-sm text-red-400/50">
            The room is destroyted succesfully.
          </p>
        </div>}
        {isError === "room-is-full" && <div className="py-4 border border-red-800/50 bg-red-950/50 text-center">
          <span className="text-red-400">ROOM FULL</span>
          <p className="text-sm text-red-400/50">
            The room is has reached there max capacity.
          </p>
        </div>}
        {isError === "invalid-room-id" && <div className="py-4 border border-red-800/50 bg-red-950/50 text-center">
          <span className="text-red-400">INVALID ROOM</span>
          <p className="text-sm text-red-400/50">
            The room is minght not be created or maybe doesn{"'"}t exist yet.
          </p>
        </div>}
        <div className="text-center space-y-2">
          <h1 className="font-bold text-2xl tracking-tight text-center text-green-500">
            {">"}Private_chat
          </h1>
          <p className="text-zinc-500">A private, self-destructing chat room.</p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-zinc-500 flex items-center ">Your Identity</label>
              <div className="flex items-center gap-3">
                <div className="border-zinc-800 bg-zinc-950 border p-3 flex-1 text-sm text-zinc-400"> {username}</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => createRoom()} className="bg-zinc-100 text-zinc-950  w-full p-3 cursor-pointer hover:bg-zinc-50 text-sm transition-colors font-bold mt-2">CREATE SECURE ROOM</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
