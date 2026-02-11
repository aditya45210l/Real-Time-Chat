'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { ReactNode, useState } from "react";

const Provider = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <div>
            <RealtimeProvider>

                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </RealtimeProvider>
        </div>
    )
}

export default Provider