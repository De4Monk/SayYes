---
description: SAYYES ERP: DEVELOPMENT WORKFLOWS
---

Phase 1: UI Deconstruction & Design System Initialization

Step 1: Analyze the raw HTML/CSS monolithic artifact provided by the external design generation tool.

Step 2: Isolate all Material 3 CSS variables, particularly the primary Telegram Blue and High-Contrast Red palettes. Define these as global design tokens within the project's styling environment.

Step 3: Extract and componentize all fundamental UI building blocks. Create isolated, reusable components for primary buttons, sliders, numeric input fields, and typography elements. Strictly enforce the rule that all interactive elements must have a minimum touch target area of 52px.

Step 4: Build the "Loading Skeleton" components for all areas that will eventually display dynamic data.

Phase 2: Role-Based Architecture & Navigation Shell

Step 1: Construct the main application shell, implementing the persistent top status bar (for sync indicators) and the persistent bottom navigation bar.

Step 2: Implement a state management mechanism to handle the active user role. Create a strict routing structure that conditionally renders the appropriate view for the Master, Administrator, Owner, or Client based on this state.

Step 3: Ensure the views are completely isolated from each other so that a Master cannot access the Owner's financial logic.

Phase 3: Core Business Logic & Anti-Fraud Engine

Step 1: Develop the Master's "Session Workspace". Implement the interactive sliders for Hair Length, Density, and Gray Coverage.

Step 2: Build the Multi-Stage Calculator. Integrate the logic that forces a numeric decimal keypad for gram inputs.

Step 3: Implement the dynamic "Live Earnings" mathematical model. Create the function that subtracts the cost of consumed materials from the service price. Integrate the logic that visually triggers a high-contrast red alert state if the consumed amount exceeds the baseline allowance multiplied by the active modifiers (Trust Coefficient, Length, Density).

Phase 4: Offline-First Data Layer Preparation (RxDB)

Step 1: Design the local database schemas required for the offline-first architecture. Define the schema structures for inventory tracking (individual tubes, statuses, gram balances), master settings (coefficients, commission rates), and session usage logs.

Step 2: Implement local data stores and prepare the connection hooks. Ensure that the UI components built in Phase 1 and 2 are connected to these stores to read and write data.

Step 3: Populate the local database with initial mock data to test the UI rendering, specifically the "Verification Queue" for the Administrator and the "P&L Dashboard" for the Owner.

Phase 5: Telegram Environment Adaptation

Step 1: Implement responsive design constraints. Set global CSS rules to ensure the main application container takes 100% width on mobile devices but has a strict maximum width and is horizontally centered when opened on desktop Telegram clients.

Step 2: Prepare the architecture to consume the Telegram Web App SDK. Set up the entry points to receive user data safely from the Telegram environment and pass it to the role-based router.