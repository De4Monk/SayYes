# System Architecture

The SayYes ERP operates as a distributed system utilizing three main components: a frontend React application, a backend database provider, and a lightweight Node.js worker.

## 1. Frontend: Telegram Mini App (React)
The frontend is built with React and Vite. It is deployed as a static web application to Google Cloud Run.
- **Telegram WebApp SDK**: Loaded in `index.html`, this SDK provides context about the user (Telegram ID, theme colors) and allows interaction with the native Telegram client (e.g., requesting contact info, closing the app).
- **Authentication**: When a user opens the Mini App, their Telegram `initData` is sent to the Node.js Worker (`/auth/telegram`) to verify the cryptographic signature. The worker returns a custom JWT containing the user's role (`owner`, `admin`, `master`, `client`) and their Supabase user ID.
- **Data Fetching**: Authenticated requests are made directly from the React frontend to Supabase using the PostgREST API and the issued JWT. Row Level Security (RLS) policies ensure data privacy.

## 2. Database: Supabase (PostgreSQL)
Supabase acts as the primary data store and authentication authority.
- **Tables**: Critical tables include `profiles`, `clients`, `appointments`, `notification_queue`, `reviews`, `inventory`, and `salon_settings`.
- **RPC Functions**: Custom PostgreSQL functions handle complex atomic operations:
  - `merge_client_profiles`: Merges duplicate client records based on phone numbers.
  - `pop_notification_queue`: Safely pulls and locks exactly 50 pending notifications for the worker to process, preventing race conditions.
  - `log_usage_and_update_unit`: Atomically subtracts consumable grams from inventory and records the usage log simultaneously.
- **Security**: Access is strictly governed by custom JWT claims (`role`, `tenant_id`) enforced by RLS policies.

## 3. Worker Service: Node.js / Express
The `sayyes-worker` is a decoupled Node.js service, deployed separately to Cloud Run. It fulfills three critical roles:
1. **Auth Provider**: Validates Telegram Mini App `initData`, queries Supabase (via Service Role Key), handles auto-registration for new clients, and signs Custom JWTs for the frontend.
2. **Webhook Receiver**: Receives updates directly from the Telegram Bot API. It processes the `/start` command, handles shared contact cards (triggering the merge RPC), parses inline button callbacks (like NPS scores), and listens for text messages (to attach as negative review comments).
3. **Queue Processor**: Exposes the `/internal/process-queue` endpoint. Triggered every minute by Google Cloud Scheduler, this endpoint calls `pop_notification_queue`, communicates with the Telegram API to send messages, and updates the status of each notification in Supabase (`sent` or `failed`).

## Architecture Diagram (Logical)

```text
[Telegram Client] 
  |
  |-- (Mini App Open) --> [React Frontend (Cloud Run)]
  |                         |-- (InitData) --> [Node.js Worker /auth/telegram]
  |                         |                      |-- (Verify, Sign JWT)
  |                         |<-- (Custom JWT) -----|
  |                         |
  |                         |-- (Data queries) --> [Supabase DB]
  |
  |-- (Bot Chat / Webhooks) --> [Node.js Worker /webhook/telegram]
  |                                 |-- (Process /start, text, NPS) --> [Supabase DB]
  |
[Google Cloud Scheduler]
  |
  |-- (Every 1 min) --> [Node.js Worker /internal/process-queue]
                            |-- (Fetch batch) --> [Supabase DB]
                            |-- (Send Msgs)   --> [Telegram API]
```
