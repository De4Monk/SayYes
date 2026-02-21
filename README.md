# SayYes ERP - Telegram Mini App & Notification System

SayYes ERP is a comprehensive, offline-first application designed for salon management, client engagement, and master scheduling, built directly into Telegram as a Mini App. It provides tailored interfaces for four critical roles: **Owner**, **Admin**, **Master**, and **Client**. 

## 🏗 Technology Stack

- **Frontend**: React, Vite, TailwindCSS, Material 3 Design System
- **State Management**: Zustand (UI State), RxDB (Offline-first architecture, planned)
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Auth, RPC functions)
- **Worker Service**: Node.js, Express (hosted on Google Cloud Run)
- **Integration**: Telegram Bot API (Webhooks & Mini App), Dikidi (Booking), WhatsApp (Green API - planned)
- **Deployment**: Google Cloud Run (Frontend & Node.js Worker), Supabase Hosted DB
- **Task Scheduling**: Google Cloud Scheduler (Cron jobs for queue processing)

## 🔑 Core Features

1. **Role-Based Access Control (RBAC)**: Dynamic routing and components based on user roles (`owner`, `admin`, `master`, `client`).
2. **Telegram Mini App Integration**: Seamlessly operates within the Telegram environment, adopting themes, confirming contacts, and rendering dynamic UI based on the user's Telegram ID.
3. **Automated Notification Queue**: A robust system that queues and sends reminders, feedback (NPS) requests, and promotional messages via a dedicated Node.js worker.
4. **NPS & Review System**: Automated post-visit feedback loops that collect scores, redirect satisfied users to public review platforms, and capture negative experiences as internal incidents for the Owner/Admin dashboard.
5. **Inventory Management**: Track salon consumables, compute usage logs, and trigger alerts when stock falls below thresholds.
6. **Master Scheduling & Tracking**: Masters can view their upcoming appointments, manage their journal, and review daily stats.

## 📂 Project Structure

- `/src`: React frontend application.
  - `/components`: Atomic design structure (`atoms`, `molecules`, `organisms`, `pages`).
  - `/contexts`: React Contexts (e.g., Auth, UI State).
  - `/lib`: Initialization and utility files (e.g., Supabase client, API helpers).
- `/sayyes-worker`: Node.js Express server acting as the webhook receiver and notification queue processor.
- `/supabase`: SQL schema definitions and database instructions.
- `/docs`: Detailed documentation regarding architecture and specific workflows.

## 🚀 Getting Started

### React Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Node.js Worker
```bash
cd sayyes-worker
npm install
npm start
```

## 📖 Documentation

For more in-depth information, refer to the `/docs` folder:
- [System Architecture](docs/ARCHITECTURE.md)
- [Notifications and NPS Flow](docs/NOTIFICATIONS_AND_NPS.md)

---
*Developed for the SayYes salon network.*
