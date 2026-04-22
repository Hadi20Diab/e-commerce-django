# LUXE E-Commerce

Full-stack e-commerce platform built with **Django 5 + Django REST Framework** (backend) and **Next.js 14** (frontend).

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Django 5.0, DRF, JWT (SimpleJWT), SQLite        |
| Frontend  | Next.js 14 (App Router), CSS Modules            |
| Payments  | Stripe (card), PayPal (sandbox/live)            |
| Images    | Pillow, `picsum.photos` seed data               |

---

## Prerequisites

- **Python 3.11+** (the project also runs on 3.13)
- **Node.js 18+** and **npm**
- A virtual environment tool (`venv` built-in)

---

## 1. Clone & set up the backend

```bash
git clone <repo-url>
cd e-commerce-django

# Create and activate a virtual environment INSIDE the backend folder
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 1a. Configure backend environment variables

Copy and edit `backend/.env`:

```ini
SECRET_KEY=django-insecure-change-this-in-production-use-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Stripe — https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY

# PayPal — https://developer.paypal.com/dashboard/applications/sandbox
PAYPAL_CLIENT_ID=REPLACE_WITH_YOUR_PAYPAL_CLIENT_ID
PAYPAL_SECRET=REPLACE_WITH_YOUR_PAYPAL_SECRET
PAYPAL_MODE=sandbox   # change to 'live' for production
```

> The server starts even without Stripe/PayPal keys — those payment methods simply return HTTP 503 until keys are supplied.

### 1b. Run migrations and seed data

```bash
# Still inside backend/ with .venv active
python manage.py migrate

# Create a superuser (for /admin)
python manage.py createsuperuser

# Seed categories, products, and banners
# This downloads real product images from picsum.photos (~30 s)
python manage.py seed_data

# To seed without downloading images (offline / fast):
python manage.py seed_data --no-images
```

### 1c. Start the Django development server

```bash
python manage.py runserver
# API available at http://localhost:8000/api/
# Admin panel at  http://localhost:8000/admin/
```

---

## 2. Set up the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
```

### 2a. Configure frontend environment variables

Create `frontend/.env.local` (already exists if you have checked it out):

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Stripe publishable key (starts with pk_test_ for sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY

# PayPal Client ID (from sandbox application)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=REPLACE_WITH_YOUR_PAYPAL_CLIENT_ID
```

> The frontend works without Stripe/PayPal keys — you'll see a "not configured" message instead of the payment widgets.

### 2b. Start the Next.js development server

```bash
npm run dev
# App available at http://localhost:3000
```

---

## 3. Payment gateway setup

### Stripe (card payments)

1. Create a free account at <https://stripe.com>
2. Go to **Developers → API keys** in test mode
3. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `frontend/.env.local`
4. Copy **Secret key** → `STRIPE_SECRET_KEY` in `backend/.env`
5. Use test card **4242 4242 4242 4242**, any future expiry, any CVC

### PayPal (sandbox)

1. Create a developer account at <https://developer.paypal.com>
2. Go to **Apps & Credentials → Sandbox**
3. Create an app and copy:
   - **Client ID** → `PAYPAL_CLIENT_ID` in `backend/.env` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` in `frontend/.env.local`
   - **Secret** → `PAYPAL_SECRET` in `backend/.env`
4. Use a PayPal sandbox buyer account to test checkout

---

## 4. Project structure

```
e-commerce-django/
├── backend/
│   ├── config/          # Django settings, URLs, WSGI
│   ├── users/           # Custom User model, JWT auth, addresses
│   ├── products/        # Categories, Products, ProductImages, Banners
│   ├── cart/            # Shopping cart (per-user)
│   ├── orders/          # Order placement, Stripe & PayPal integration
│   ├── contact/         # Contact form
│   ├── .env             # Backend secrets (never commit)
│   └── requirements.txt
│
└── frontend/
    ├── app/             # Next.js 14 App Router pages
    │   ├── page.js                  # Home
    │   ├── products/                # Product list + detail
    │   ├── cart/                    # Cart
    │   ├── checkout/                # Checkout (Stripe + PayPal)
    │   ├── auth/login|register      # Auth pages
    │   ├── account/                 # Profile, orders, addresses
    │   ├── contact/
    │   └── (static pages: faq, shipping-policy, returns, …)
    ├── components/
    │   ├── icons/        # SVG icon library
    │   ├── layout/       # Navbar, Footer
    │   └── product/      # ProductCard
    ├── context/          # AuthContext, CartContext, ToastContext
    ├── lib/              # api.js (Axios), utils.js
    ├── styles/           # globals.css (CSS custom properties)
    └── .env.local        # Frontend secrets (never commit)
```

---

## 5. API endpoints summary

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET/PATCH | `/api/auth/profile/` | User profile |
| GET/POST | `/api/auth/addresses/` | Shipping addresses |
| GET | `/api/products/` | Product list (filterable) |
| GET | `/api/products/featured/` | Featured products |
| GET | `/api/products/<slug>/` | Product detail |
| GET | `/api/products/categories/` | All categories |
| GET/DELETE | `/api/cart/` | Get / clear cart |
| POST | `/api/cart/add/` | Add item |
| PATCH/DELETE | `/api/cart/items/<id>/` | Update / remove item |
| GET | `/api/orders/` | Order history |
| POST | `/api/orders/create/` | Place order (mock / card) |
| GET | `/api/orders/<id>/` | Order detail |
| POST | `/api/orders/stripe/create-intent/` | Create Stripe PaymentIntent |
| POST | `/api/orders/paypal/create-order/` | Create PayPal order |
| POST | `/api/orders/paypal/capture/` | Capture PayPal payment & create order |
| POST | `/api/contact/` | Contact form |

---

## 6. Useful commands

```bash
# Backend — reset and re-seed (clears all products)
python manage.py flush --no-input
python manage.py seed_data

# Frontend — production build
npm run build
npm start
```
