# 🏪 SmartStore Manager

A full-stack retail store management platform built for small businesses in India. Manages inventory, billing, suppliers, reports, and alerts — all in one place.

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run Everything in One Command

```bash
git clone <your-repo-url>
cd smart-store-manager
docker compose up --build
```

Wait ~2 minutes for the first build, then open:

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | http://localhost:3000 |
| ⚙️ **Backend API** | http://localhost:5000/api |
| 🐘 **PostgreSQL** | localhost:5432 |

### Default Login
| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@store.com` | `password` |

---

## 📦 Project Structure

```
smart-store-manager/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   ├── db.js            # PostgreSQL connection
│   │   └── schema.sql       # DB schema + seed data
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── billingController.js
│   │   │   └── supplierController.js
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT authentication
│   │   ├── routes/
│   │   │   └── index.js     # All API routes
│   │   └── index.js         # Entry point + cron jobs
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── frontend/                 # React 18 + Recharts
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── components/
│   │   │   └── Sidebar.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Inventory.js
│   │   │   ├── Billing.js
│   │   │   ├── Suppliers.js
│   │   │   ├── Reports.js
│   │   │   ├── PnL.js
│   │   │   ├── ExpiryAlerts.js
│   │   │   ├── Notifications.js
│   │   │   └── Users.js
│   │   ├── utils/
│   │   │   └── api.js       # Axios instance
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css        # Global design system
│   ├── nginx.conf           # Nginx with API proxy
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Lucide Icons |
| Styling | Custom CSS design system (dark theme, CSS variables) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 15 |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Cron Jobs | node-cron |
| Container | Docker + Docker Compose |
| Proxy | Nginx (API proxy + SPA routing) |

---

## 📋 Features

### ✅ Dashboard
- Today's revenue, bills, low-stock count, expiry alerts
- 7-day revenue bar chart
- Top 5 selling products (last 30 days)
- Recent bills table

### ✅ Inventory Management
- Full product CRUD (name, SKU, barcode, pricing, stock, expiry)
- Category and supplier assignment
- Live stock bar with color indicators
- Margin % calculation per product
- Search + category filter

### ✅ Billing / POS
- Product grid with click-to-add
- Barcode scanner support (Enter key trigger)
- Quantity controls, tax auto-calculation
- Discount support
- Cash / UPI / Card payment modes
- Bill generation with stock auto-deduction
- Print-ready bill summary

### ✅ Supplier Management
- Vendor CRUD with GSTIN support
- Purchase Orders creation
- Receive Stock → auto-updates inventory
- Outstanding dues tracker
- Mark dues as paid

### ✅ Sales Reports
- Date-range filtering
- Daily revenue trend chart
- Top products by revenue with margin
- Dead stock (unsold 30+ days) list

### ✅ Profit & Loss
- Per-product margin analysis
- Revenue vs COGS breakdown
- Color-coded profitability (green/amber/red)
- Table + horizontal bar chart views

### ✅ Expiry Alerts
- Expired / Critical (≤7 days) / Warning (≤30 days)
- Low stock alerts with shortage calculation
- Summary stat cards

### ✅ Notifications
- Email / WhatsApp / SMS toggle config
- Alert type selection (low stock, expiry, daily summary)
- Sample notification preview

### ✅ Users & Roles
- 3-tier RBAC: Owner → Manager → Cashier
- User CRUD with role assignment
- Permissions matrix visualization

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Any |
| POST | `/api/products` | Owner, Manager |
| PUT | `/api/products/:id` | Owner, Manager |
| DELETE | `/api/products/:id` | Owner, Manager |
| GET | `/api/products/barcode/:code` | Any |

### Billing
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/bills` | Any |
| GET | `/api/bills` | Any |
| GET | `/api/billing/dashboard` | Any |
| GET | `/api/billing/reports` | Owner, Manager |
| GET | `/api/billing/pnl` | Owner |

### Suppliers
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/suppliers` | Owner, Manager |
| POST | `/api/suppliers` | Owner, Manager |
| GET | `/api/purchase-orders` | Owner, Manager |
| POST | `/api/purchase-orders` | Owner, Manager |
| POST | `/api/purchase-orders/:id/receive` | Owner, Manager |

---

## 🌱 Database Schema (15 tables)

`users`, `roles`, `products`, `categories`, `suppliers`, `supplier_products`, `purchase_orders`, `po_items`, `bills`, `bill_items`, `expiry_alerts`, `reorder_alerts`, `notification_config`, `audit_logs`

---

## 🛠️ Local Development (Without Docker)

### Backend
```bash
cd backend
npm install
# Set up PostgreSQL locally, then:
cp .env.example .env  # edit DB credentials
npm run dev           # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start             # starts on port 3000
```

---

## 🔒 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | postgres | PostgreSQL host |
| `DB_NAME` | smartstore | Database name |
| `DB_USER` | postgres | DB username |
| `DB_PASSWORD` | postgres123 | DB password |
| `JWT_SECRET` | — | **Change in production!** |
| `FRONTEND_URL` | http://localhost:3000 | CORS allowed origin |

---

## 📱 Cron Jobs

| Time | Job |
|------|-----|
| 00:00 (midnight) | Scan all products, create expiry alerts |
| 21:00 (9 PM) | Check low-stock, trigger WhatsApp/SMS summary |

---

## 🚀 Production Deployment

1. Change `JWT_SECRET` in `docker-compose.yml`
2. Change `DB_PASSWORD` to a strong password
3. Add SSL/TLS via Nginx reverse proxy or Cloudflare
4. Set `REACT_APP_API_URL` to your domain

---

## 📄 License

MIT — free for personal and commercial use.
