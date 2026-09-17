# AG TRADERS CRM — AI AGENT MASTER CONTEXT & HANDOFF DOCUMENT

> **Document Type:** Full Project Context, Architecture Audit, & AI Agent Roadmap  
> **Showroom / Business:** AG TRADERS — KAG Tiles Exclusive Showroom, Tiruchengode  
> **Last Updated:** 2026-09-17  
> **Source Conversation ID:** `7567795c-0587-4a7c-938c-885eb3867807`  
> **Letterhead Project Conversation ID:** `9fabf28c-2c0b-4d7d-8aeb-837db5d1e82e`  
> **Live Production URL:** `https://crm-v1-1.natrajag1.workers.dev`  
> **Git Repository:** `https://github.com/agtraderstgode-max/crm-v1.1.git` (`main` branch)  
> **Local Project Directories:** `/Users/raja/software/crm v1` (Symlinked: `/Users/raja/software/CRM`)

---

## 1. HOW TO USE THIS FILE IN A NEW CHAT / PROJECT

When opening a new AI chat or moving to another project/tool:
1. Pass this file: `AG_TRADERS_AI_AGENT_MASTER_CONTEXT.md` or tell the AI:  
   *"Read `/Users/raja/software/CRM/AG_TRADERS_AI_AGENT_MASTER_CONTEXT.md` for complete context on AG TRADERS CRM and the AI Agent Roadmap."*
2. You can also reference the previous Conversation ID: `7567795c-0587-4a7c-938c-885eb3867807`.
3. The assistant will immediately know the entire project architecture, database schema, existing AI setups, and exact roadmap without asking repeat questions.

---

## 2. PROJECT OVERVIEW & ARCHITECTURAL AUDIT

### 2.1 Tech Stack
- **Frontend:** React 19 (`react` 19.2.7), Vite 8, React Router v7 (`react-router-dom` 7.18.1), Tailwind CSS v4 (`@tailwindcss/vite` 4.3.2), Lucide React (`lucide-react` 1.23.0).
- **Backend / Dual-Mode Operation:**
  1. **Local Node.js Server (`server.js`):** Express 5 on port 5001. Local-first JSON caching in `data/` (`leads.json`, `orders.json`, `products.json`, etc.) with automated background offline sync queue (`syncRecordToSupabase`) to Supabase.
  2. **Production / Cloudflare Workers Mode:** The site is deployed statically to Cloudflare (`crm-v1-1.natrajag1.workers.dev`). Because Cloudflare static workers have no Node.js backend, all browser `fetch` calls to `/api/*` are intercepted transparently in the browser by `src/lib/apiAdapter.js` and handled via `@supabase/supabase-js`.
- **Database (Supabase PostgreSQL):**
  - **URL:** `https://fyycsuprnwpacbsiyzrt.supabase.co`
  - **Client Initialization:** `src/lib/supabaseClient.js`
  - **Status:** Connected and fully verified.

---

### 2.2 Live Database Schema Audit (Direct from Supabase)

| Table Name | Actual Columns & Data Types | Purpose / CRM Mapping |
| :--- | :--- | :--- |
| `leads` | `id, date, name, phone, location, lat, lng, km, source, size, budget, housetype, custtype, stage, expectedamt, priority, status, nextdate, withindays, remarks, attendedby, history, created_at` | Primary Lead & Enquiry table. **Also powers Follow-ups** (via `nextdate`, `history`) and **Buying Now** (leads with status 'Ready to Buy' / immediate stage). |
| `customers` | `id, name, phone, location, custtype, expectedamt, attendedby, remarks, source, size, housetype, stage, budget, date, created_at` | Customer master directory. Populated automatically when quotes/leads convert. |
| `orders` | `id, customer, phone, date, items, total, status, delivery, deliverytype, transport, vehicleinfo, handleby, confirmedat, dispatchedat, deliveredat, splitpayments, balancemode, paymentnotes, itemsdetails, created_at` | Sales Orders. Supports order statuses (`Processing`, `Confirmed`, `Dispatched`, `Delivered`, `Cancelled`). Cancel reasons/timestamps embedded in `paymentnotes` via `[CANCELLED: ...][AT: ...]`. |
| `products` | `id, name, brand, category_id, size, finish, price, stock, reserved, available, min, unit, created_at` | Inventory master. Tracks tile models, brands (KAG etc.), stock count, reserved, and minimum threshold. |
| `categories` | `id, size, name, type, sqft_per_box, pcs_per_box, mrp, online_price, sqft_price, discount_pct, weight_per_box, created_at` | Tile size categories, box conversion metrics (sqft/box, pcs/box), MRP, and square foot pricing. |
| `staff` | `id, name, role, address, phone, whatsapp, telegram, email, aadhaar, username, passcode, status, workinghours, shifthours, workingdays, joindate, attendance, incentives, created_at` | Employee master. Roles: `Manager`, `Staff 1`, `Staff 2`, `Staff 3`. Contains PIN passcodes for internal verification, daily attendance punch-in/out, and sales incentives. |
| `estimates` | `id, customer_name, customer_phone, plan_date, plan_notes, rooms, quotation_items, quote_customer_name, quote_number, quote_date, next_id, created_at` | Cloud-stored 2D room plan quotations and estimates from the Quotation Planner tool. |
| `returns` | `id, bill_no, customer, phone, date, items, total_refund, reason, status, created_at` | Sales returns and refund records. |
| `referrals` | `id, name, phone, type, commission_pct, total_orders, total_commission, paid_commission, pending_payout, history, created_at` | Influencer / Contractor / Mason / Engineer referral partners and commissions. |
| `chat_messages` | `id, sender_id, sender_name, recipient_id, message, timestamp, created_at` | Internal staff-to-staff and group team chat records. |

---

### 2.3 Existing CRM Modules & Routes

All routes registered in `src/router/index.jsx` wrapped in `src/components/layout/AppLayout.jsx` with fixed sidebar `src/components/layout/Sidebar.jsx`:

1. **MAIN:**
   - `/dashboard` — KPI cards, monthly sales summary, recent leads, quick stats (`DashboardPage.jsx`).
   - `/analysis` — Business intelligence, geographic distance analysis, conversion analytics (`AnalysisPage.jsx`).
   - `/chat` — Internal staff & team group messaging with PIN authentication (`ChatPage.jsx`).
   - `/letter-pad` — Official AG TRADERS letterhead & quotation editor (`LetterPadPage.jsx`). Embeds `/letterhead/index.html` with formatting toolbar (Bold, Italic, Underline, Left/Center/Right/Justify alignments, Bullet & Numbered lists, Print to A4 PDF, auto-save).
2. **CRM:**
   - `/leads` — Enquiry - Lead management with GPS location, distance (KM), customer type, house stage (`LeadsPage.jsx`).
   - `/followups` — Follow-up pipeline grouped into Overdue, Today, and Upcoming; records follow-up remarks & history (`FollowupsPage.jsx`).
   - `/buying-now` — Fast-track immediate buying customers with quick quotation builder (`BuyingNowPage.jsx`).
   - `/customers` — Customer database and purchase history (`CustomersPage.jsx`).
3. **SALES:**
   - `/quotations` — 2D Room Tile Planner & Box Estimator iframe app (`QuotationsPage.jsx`).
   - `/orders` — Sales order processing, dispatch scheduling, delivery tracking, and cancellation with mandatory reasons (`OrdersPage.jsx`).
   - `/payments` — Payment ledger, split payments tracking, and outstanding balances (`PaymentsPage.jsx`).
   - `/billing` — Invoicing and billing summary (`BillingPage.jsx`).
4. **INVENTORY:**
   - `/products` — Tile product catalog and pricing (`ProductsPage.jsx`).
   - `/stock` — Warehouse stock levels and low-stock indicators (`StockPage.jsx`).
   - `/purchase-invoices` — Tax purchase invoice scanner and stock update engine (`PurchasePage.jsx`).
   - `/returns` — Sales returns and stock rollback (`ReturnsPage.jsx`).
   - `/price-categories` — Formula categories, discounts, box calculations (`PriceCategoriesPage.jsx`).
5. **MARKETING & OPERATIONS:**
   - `/marketing` — Lead source tracking, campaign channels (`MarketingPage.jsx`).
   - `/referral` — Mason/Engineer referral commission partner management (`ReferralPage.jsx`).
   - `/staff` — Staff profile, punch-in/out attendance, incentives (`StaffPage.jsx`).
   - `/settings` — CRM configurations (`SettingsPage.jsx`).

---

### 2.4 Existing AI Integrations (Audit Details)

Currently, AI is used in **Invoice Scanning** under `src/modules/inventory/purchase/pages/PurchasePage.jsx` and `server.js` (`/api/upload-invoice`):
1. **Google Gemini:**
   - Package: `@google/genai` (v2.10.0)
   - Models used: `gemini-2.5-flash`, `gemini-2.5-pro`
   - Purpose: Scans supplier tax invoice PDFs/images, extracts supplier info, invoice no, tax breakdown, and product line items structured as JSON.
2. **Mistral AI:**
   - Endpoint: `https://api.mistral.ai/v1/ocr` (`mistral-ocr-latest`) followed by `https://api.mistral.ai/v1/chat/completions` (`mistral-large-latest`).
   - Purpose: Alternative OCR and invoice structure extraction engine.
3. **Current Key Management:**
   - Currently, users paste their Gemini / Mistral API keys in the Purchase Invoice settings UI, which stores them in browser `localStorage` (`gemini_api_key`, `mistral_api_key`, `gemini_provider`) and passes them via headers (`x-gemini-key`, `x-mistral-key`, `x-provider`).
   - **Key Finding for AG AI:** For the unified AG AI Assistant, API keys must be securely centralized on the server / environment or configured securely rather than relying solely on page-level localStorage.

---

## 3. AG AI — AGENT MASTER SPECIFICATION

### 3.1 Objective: The Unified Floating Assistant
AG AI must be a single, omnipresent floating assistant across the CRM.
- **Position:** Bottom-right floating action button (`🤖 AG AI`).
- **Popup:** Responsive card on desktop (compact floating modal), full-height drawer on mobile.
- **Context-Aware:** Automatically detects the user's current URL route (`useLocation`), active record IDs, selected customers/leads, logged-in user, and current date.
- **Dual Support:** Must work seamlessly in both Local Node.js environment (`server.js`) and Cloudflare Workers production environment (`apiAdapter.js`).

---

### 3.2 AI Orchestrator Architecture

```text
Frontend (Any CRM Page)
         ↓
   AG AI UI Widget (Bottom-Right)
         ↓
  Context Detector (Route, Current Customer, Current Lead, Role, Date)
         ↓
   POST /api/ai/chat
         ↓
  AI Orchestrator (Server / apiAdapter)
         ↓
 ┌───────────────────────┬────────────────────────┐
 │ Context & Intent      │ Tool / Function Router │
 └───────────────────────┴────────────────────────┘
         ↓
  CRM Read/Write Tools (Executing against Supabase / Local Cache)
         ↓
  AI Provider Abstraction Layer
    ├── Primary: Google Gemini (`@google/genai`)
    └── Fallback: Mistral AI (`api.mistral.ai`)
         ↓
  Verified Response & Action Confirmation
         ↓
  Frontend UI
```

---

### 3.3 Memory Architecture (3 Levels)

1. **Level 1 — Current Conversation Memory:**
   - Maintains multi-turn context (e.g., User: "Show Ramesh's enquiry." -> User: "What is his budget?" -> AI resolves "his" = Ramesh).
2. **Level 2 — CRM Record Memory:**
   - Real-time data lookup from Supabase (`leads`, `customers`, `orders`, `products`, `staff`, `estimates`). The AI does NOT store duplicate CRM data; it queries live CRM records.
3. **Level 3 — Long-Term Memory (`ai_memory`):**
   - For entity-specific customer preferences (e.g., "Customer prefers matte finish grey tiles"), business heuristics, and conversation summaries.
   - Schema: `id, entity_type, entity_id, memory_type, content, importance, created_at`.

---

### 3.4 CRM Tools (Function Calling Definitions)

The AI will interact through strictly typed function calls:

1. **Customer Tools:**
   - `search_customers(query)`
   - `get_customer(id)`
   - `get_customer_history(customer_id_or_phone)`
2. **Enquiry & Lead Tools:**
   - `search_enquiries(status, priority, date_range, source, stage)`
   - `get_enquiry(id)`
   - `get_pending_followups(date_filter)` -> returns overdue and today's leads from `leads` where `nextdate <= today`
   - `update_enquiry_status(id, status, remarks)` *(Requires validation)*
   - `create_followup(lead_id, next_date, remarks)` *(Requires validation)*
3. **Sales & Orders Tools:**
   - `get_sales_summary(period: 'today' | 'this_week' | 'this_month')`
   - `get_orders(status)`
   - `get_order_details(order_id)`
4. **Stock & Inventory Tools:**
   - `search_stock(query, category_id)`
   - `get_low_stock(threshold)` -> queries `products` where `stock <= min`
5. **Staff Tools:**
   - `get_staff_list()`
   - `get_staff_attendance(date)`
   - `get_staff_pending_followups(staff_name)`
6. **Analytics & Location Tools:**
   - `get_dashboard_metrics()`
   - `get_area_enquiry_distribution()` -> uses `location`, `lat`, `lng`, `km` from `leads`

---

### 3.5 Action Permission & Guardrails
- **Read Actions:** Automatically executed based on user role.
- **Safe Write Actions (e.g., adding a follow-up note):** AI prepares action, logs, and executes.
- **High-Risk Actions (e.g., order cancellation, deleting data):**
  - AI MUST present an explicit interactive confirmation card in the chat:
    ```text
    ⚠️ AG AI wants to perform:
    Action: Cancel Order ORD-014
    Reason: Customer requested alternate size
    [Cancel] [Confirm Action]
    ```
- **Audit Logging:** Every AI tool execution is recorded in `ai_action_logs` (`id, user_id, tool_name, arguments, result, status, created_at`).

---

## 4. PHASED ROADMAP (HOW TO PROCEED)

- **Phase 0 (Complete):** Codebase & database schema audit documented in this master file.
- **Phase 1:** Central AI Provider & Orchestrator Service:
  - Create provider wrapper supporting Gemini (`@google/genai`) with Mistral fallback.
  - Implement `/api/ai/chat` endpoint (in `server.js` and `apiAdapter.js` for Cloudflare).
- **Phase 2:** Global Floating `AG AI` Assistant Component:
  - Add floating toggle button in `AppLayout.jsx` (visible across all routes).
  - Context hook `usePageContext()` detecting current route and selected entities.
  - Chat window with streaming/loading states, suggested quick prompts, and clear button.
- **Phase 3:** Read-Only CRM Tools:
  - Connect AI to read tools for enquiries, follow-ups, customers, orders, stock, and staff.
- **Phase 4:** Conversation & Context Memory:
  - Multi-turn state management and context window pruning.
- **Phase 5:** Safe Write Actions & Interactive Action Cards:
  - Controlled creation of follow-ups and lead status updates with user confirmation.
- **Phase 6:** Business Intelligence & Tiruchengode Area Analysis:
  - Geographic lead density, conversion by source, and revenue summaries.

---

## 5. ESSENTIAL COMMANDS & WORKSPACE INFO

- **Start Dev Environment:**
  ```bash
  npm run dev
  # Runs backend on http://localhost:5001 and Vite on http://localhost:5173
  ```
- **Build Production Bundle:**
  ```bash
  npm run build
  # Builds to dist/ directory
  ```
- **Deploy to Cloudflare:**
  ```bash
  git add .
  git commit -m "your message"
  git push origin main
  # Cloudflare Workers automatically builds and deploys from origin main
  ```
