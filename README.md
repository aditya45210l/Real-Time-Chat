# 🛡️ Real-Time Chat: Private Self-Destructing Rooms

A secure, ephemeral chat application built with **Next.js 15**, **ElysiaJS**, and **Upstash Redis**. Create private, two-person chat rooms that automatically self-destruct after 10 minutes, ensuring zero data persistence and total privacy.

---

## ✨ Features

* **🔒 Ephemeral by Design:** All messages and room metadata are wiped from the database after a 10-minute TTL (Time-to-Live) or upon manual destruction.
* **👥 Strict Two-Person Limit:** Enforces a maximum of two users per room using server-side proxy gating and token-based authentication.
* **⚡ Real-Time Synchronization:** Powered by **Upstash Realtime** for instant message delivery without the overhead of traditional polling.
* **🛠️ Type-Safe Architecture:** Full end-to-end type safety using **ElysiaJS** and **Eden Treaty**, connecting the backend and frontend seamlessly.
* **👤 Persistent Anonymous Identity:** Automatic, local-first username generation (e.g., `shark-anonymous-8x2k1`) using a custom `useUsername` hook.
* **🎨 Terminal Aesthetic:** A clean, dark-mode UI utilizing **JetBrains Mono** and Tailwind CSS for a high-tech feel.

---

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Runtime** | PNPM |
| **API Server** | ElysiaJS (High-performance API) |
| **Database/Pub-Sub** | Upstash Redis |
| **Real-Time SDK** | Upstash Realtime |
| **State Management** | TanStack Query (React Query) |
| **Styling** | Tailwind CSS + JetBrains Mono |
| **Validation** | Zod |

---

## 🛠️ Getting Started

### Prerequisites

* [pnpm](https://bun.sh/) installed.
* An [Upstash](https://upstash.com/) account for Redis and Realtime.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/aditya45210l/Real-Time-Chat.git](https://github.com/aditya45210l/Real-Time-Chat.git)
    cd Real-Time-Chat
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    UPSTASH_REDIS_REST_URL=your_redis_url
    UPSTASH_REDIS_REST_TOKEN=your_redis_token
    ```

4.  **Launch Development Server:**
    ```bash
    bun dev
    ```

---

## 🧠 Technical Deep Dive

### 1. The Room Lifecycle & Security
The app uses a **Next.js Proxy** (`src/proxy.ts`) to gate access to dynamic room routes. When a user attempts to enter a room:
* The proxy checks the Redis hash `meta:${roomId}`.
* If the room has < 2 users, it assigns an `httpOnly` cookie (`x-auth-token`).
* If the room is full or expired, it redirects the user to the lobby with a specific error state.

### 2. Real-Time Messaging Flow
We leverage **Upstash Realtime** to handle the heavy lifting of WebSockets/Server-Sent Events:
1.  **Frontend:** Sends a message via a TanStack `useMutation` to the Elysia API.
2.  **Backend:** Validates the sender’s token, stores the message in a Redis List, and emits a `chat:message` event.
3.  **Client-Side Hook:** `useRealtime` listens for the event and triggers a cache invalidation, causing the message list to refresh instantly for both users.

### 3. Automatic Data Cleanup
Cleanup is handled natively by Redis. By setting a **TTL (Time-To-Live)** on the room metadata and message lists, we ensure that even if a user closes their tab, the data is purged exactly 10 minutes after creation. 

> **Privacy Fact:** No data is stored on a persistent disk; it lives only in the ephemeral memory of the Redis instance.

---

## 🎨 UI & UX

* **Self-Destruct Timer:** A live countdown synced with the actual Redis TTL.
* **Visual Feedback:** Toast notifications and banners for room destruction, copying links, and connection errors.
* **Responsive Layout:** Fully optimized for mobile and desktop "quick chats."

---

## 📜 License

Distributed under the MIT License.