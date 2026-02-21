# Notifications & NPS Flow

The SayYes ERP incorporates a fully automated, state-driven notification and Net Promoter Score (NPS) collection system. It leverages Supabase Triggers, a Node.js Queue Processor, and the Telegram Bot API.

## System Components

1. **`notification_templates` (Table)**: Defines the message content, type (`feedback_request`, `reminder`, etc.), and delay interval relative to an appointment. The `message_text` field supports placeholders (e.g., `{{client_name}}`).
2. **`notification_queue` (Table)**: Stores scheduled notification tasks. Each row has a `status` (`pending`, `processing`, `sent`, `failed`) and a `scheduled_for` timestamp.
3. **Database Triggers (Supabase)**: When an appointment is created or updated, a PostgreSQL trigger automatically enqueues notification tasks based on active templates.
4. **Cloud Scheduler (GCP)**: A cron job pings the worker's `/internal/process-queue` endpoint every 1 minute.
5. **Node.js Express Worker (`sayyes-worker`)**: 
   - Receives the ping from Cloud Scheduler.
   - Calls the `pop_notification_queue(batch_size)` RPC to lock and fetch exactly N pending notifications.
   - For each task, formats the template with client/appointment data, generates appropriate Telegram Inline Keyboards, and attempts delivery via the Telegram API.
   - Updates the `notification_queue` row status based on success/failure.

## Net Promoter Score (NPS) Flow

The NPS system allows the salon to monitor customer satisfaction continuously and intercept negative feedback before it becomes a public online review.

### 1. Delivery
Post-visit, the automated queue generates a `feedback_request` notification in Telegram. A message is sent to the client containing an inline keyboard with 5 buttons (`1 ⭐️` to `5 ⭐️`). Each button holds a specific callback data string (e.g., `nps_5_UUID` or `nps_2_UUID`).

### 2. Rating Submission
When a client taps a star rating, a webhook is fired to `/webhook/telegram` on the worker. The worker parses the callback data prefix (`nps_X`):
- It fetches the appointment and client details.
- It inserts a new row into the `reviews` table (`client_id`, `appointment_id`, `tenant_id`, `score`).

### 3. Smart Fallback for Negative Reviews
Based on the `score` submitted:
- **Score 5**: The worker dynamically queries the `salon_settings` table for active review platforms (Google Maps, 2GIS, Yandex Maps). If links exist, it returns an inline keyboard prompting the happy user to rate the salon online. If no links are configured, it sends a generic "Thank you" reply.
- **Score 1-4 (Negative)**: The worker intercepts the user, apologizing for the negative experience and politely asking them to send a text message right there in the chat detailing what went wrong.

### 4. Incident Attachment
If the user then types a text message (a complaint) to the bot:
- The worker's `/webhook/telegram` endpoint (listening for text) identifies the sender by their Telegram ID.
- It searches the `reviews` table for any recent (within 24 hours) negative review (Score < 5) from that client that currently lacks a `comment`.
- If a match is found, it `UPDATE`s that review row, setting the `comment` field strictly to the user's text message.

### 5. Owner/Admin "Incidents" Dashboard
The React frontend (Owner and Admin roles) features an `IncidentsWidget`. This widget specifically polls the `reviews` table for incoming negative reviews. The complaints appear instantly, displaying the client's information, appointment details, the score, and the submitted text comment. Admins can click a button to immediately dial the client's phone directly from the ERP.
