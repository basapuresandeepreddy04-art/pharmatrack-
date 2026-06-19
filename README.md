# PharmaTrack — Pharmacy Inventory & Billing System

Full-stack pharmacy management system: inventory, expiry/low-stock alerts, point-of-sale billing,
and a revenue dashboard. Built with React + Vite (frontend) and Node.js/Express + MySQL (backend).

---

## What's actually included

- **Auth** — JWT login/register, owner role
- **Medicines (Inventory)** — CRUD with batch number, stock, price, expiry date
- **Alerts** — auto-generated low-stock (<10 units) and expiry (≤30 days) warnings
- **Billing (Sales/POS)** — cart-based checkout, auto-decrements stock, generates an invoice
- **Dashboard** — live revenue (today / this month / all-time), invoice counts, low-stock & expiry
  counts, top-selling medicine, recent sales
- **WhatsApp notifications** — wired to Meta's WhatsApp Cloud API, **off by default**. See
  [WhatsApp setup](#whatsapp-notifications-optional) below — this is the one piece that genuinely
  cannot work without you creating your own Meta developer credentials; no code can substitute for that.
- **Single-port production mode** — once you `npm run build` the frontend, the Express server on
  port 5000 serves it directly, so the deployed app is one process/one port (e.g. on Render.com)

---

## Quick start (local, in VS Code)

**Prerequisites:** Node.js 18+, MySQL Server running locally (or a remote MySQL you can reach), and VS Code.

1. **Open the folder in VS Code** and open a terminal (`` Ctrl+` ``).

2. **Install dependencies for both apps:**
   ```bash
   npm run install:all
   ```

3. **Create the database** — run the schema once against your MySQL server:
   ```bash
   mysql -u root -p < backend/config/schema.sql
   ```
   (Enter your MySQL root password when prompted. This creates the `pharma_inventory` database and all tables.)

4. **Configure environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Open `backend/.env` and set `DB_PASSWORD` to your real MySQL password, and change `JWT_SECRET`
   to any random string. Leave the `WHATSAPP_*` vars blank unless you've done the WhatsApp setup below.

5. **Seed sample data** (creates a login + 10 medicines + 2 sample sales):
   ```bash
   npm run seed
   ```
   Login afterwards with: `owner@pharma.com` / `owner123`

6. **Run in development** (two terminals):
   ```bash
   npm run dev:backend     # http://localhost:5000
   npm run dev:frontend    # http://localhost:3000 (proxies /api to :5000)
   ```
   Open **http://localhost:3000** in your browser.

---

## Production build (single port)

```bash
npm run build              # builds frontend into frontend/dist
npm --prefix backend start # serves API + frontend together on PORT (default 5000)
```
Visit **http://localhost:5000** — both the app and the API now run from one process.

For Render.com: set the build command to `npm run install:all && npm run build`, the start command
to `npm --prefix backend start`, and add the same environment variables from `backend/.env` in
Render's dashboard (plus your production `DB_HOST`/credentials, since Render won't have your local MySQL).

---

## WhatsApp notifications (optional)

The code in `backend/utils/whatsapp.js` calls the official **Meta WhatsApp Cloud API** whenever a
sale completes. Without credentials, it safely logs to the console instead of sending — nothing
breaks. To make it actually send messages to **+91 91004 91753** (or any number):

1. Go to developers.facebook.com → create an app → add the **WhatsApp** product.
2. Copy the temporary access token it gives you → put it in `backend/.env` as `WHATSAPP_TOKEN`.
3. Copy the test sender's **Phone Number ID** (shown on the same page) → `WHATSAPP_PHONE_NUMBER_ID`.
4. Set `OWNER_WHATSAPP_NUMBER=919100491753` (no `+`, no spaces) in `backend/.env`.
5. In the Meta dashboard, add the recipient number to your test allowlist (required for unverified apps).

This is a one-time, free setup but it's an account you create — not something any amount of code
can skip. Test tokens expire in 24 hours, so for anything beyond a demo you'd eventually request a
permanent token and verify your business with Meta.

---

## Folder structure

```
pharma-inventory/
├── backend/
│   ├── config/        db.js (MySQL pool), schema.sql
│   ├── controllers/   auth, medicine, alert, sales, dashboard
│   ├── middleware/     auth.js (JWT + role check)
│   ├── routes/         auth, medicines, alerts, sales, dashboard
│   ├── utils/           whatsapp.js (Cloud API notifier)
│   ├── server.js       Express entry point + static frontend serving
│   ├── seed.js          sample data
│   └── .env.example
└── frontend/
    └── src/
        ├── api/axios.js
        ├── components/  Layout, MedicineModal, DeleteDialog
        ├── context/AuthContext.jsx
        └── pages/        Login, Register, Dashboard, Medicines, Sales, Alerts
```

## API reference

| Method | Endpoint                  | Description                          |
|--------|----------------------------|---------------------------------------|
| POST   | `/api/auth/register`      | Create owner account                  |
| POST   | `/api/auth/login`         | Login, returns JWT                    |
| GET    | `/api/medicines`          | List medicines                        |
| POST   | `/api/medicines`          | Add medicine                          |
| PUT    | `/api/medicines/:id`      | Update medicine                       |
| DELETE | `/api/medicines/:id`      | Delete medicine                       |
| GET    | `/api/alerts`             | List alerts                           |
| GET    | `/api/alerts/stats`       | Legacy stat summary                   |
| PATCH  | `/api/alerts/:id/read`    | Mark one alert read                   |
| POST   | `/api/sales`               | Checkout a cart, generates invoice    |
| GET    | `/api/sales`               | List recent invoices                  |
| GET    | `/api/sales/:id`           | Get one invoice with line items       |
| GET    | `/api/dashboard/stats`     | Revenue, invoice and inventory stats  |

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.
