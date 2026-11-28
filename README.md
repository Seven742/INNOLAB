# InnoLab Inventory Management System (InnoLab IMS)

> **"Where Ideas Become Innovation"**  
> *Innovation & SME Incubation Hub · Kampong Thom Facility*

A modern, responsive, full-stack inventory and asset management system designed specifically for the **InnoLab Innovation & SME Incubation Hub**. Built with Next.js 16, React 19, Tailwind CSS v4, MySQL, and NextAuth.js.

---

## Key Features

### 1. Inventory & Asset Management
- **Full Item Tracking**: Register, edit, and view items with unique codes (`INV-XXXX`), serials, categories, and locations.
- **Stock Level Automation**: Dynamic tracking (`In Stock`, `Low Stock`, `Out of Stock`, `Discontinued`) with custom minimum-stock alert thresholds.
- **Image Storage**: Cloudinary integration for permanent asset photo storage with local fallback.
- **Search & Filtering**: Real-time search across item names, codes, categories, suppliers, and stock status.
- **Data Export**: One-click export to CSV and Excel (`.xlsx`).

### 2. Stock In & Stock Out Movements
- **Stock In (Inbound)**: Record incoming purchase shipments with supplier details, invoice references, and received dates.
- **Stock Out (Outbound)**: Track items distributed to departments, staff, or projects with recipient logging and reason recording.

### 3. Borrow & Return System
- **Equipment Lending**: Track shared lab equipment, cameras, laptops, and workshop tools.
- **Overdue Monitoring**: Automated status tracking (`Borrowed`, `Returned`, `Overdue`) with return condition inspections.

### 4. SME Products & Samples Showcase
- Dedicated module to catalog, track, and showcase samples and products developed by incubated local SMEs.
- Stores storage locations, quantities, SME vendor names, and sample statuses (`Active`, `Archived`, `Returned`, `Disposed`).

### 5. Categories & Supplier Directory
- **Categories**: Hierarchical category organization with dynamic item count updates.
- **Suppliers**: Manage vendor contacts, emails, phone numbers, and physical addresses.

### 6. Reports & Audit Log
- **Visual Analytics**: Interactive charts powered by Recharts (inventory valuation, movement trends, stock distributions).
- **Activity History**: Complete audit trail logging every action (user, entity, timestamp, details) for system integrity.

### 7. User Management & Security
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system control, user management, settings, deletions, and logs.
  - **Manager**: Inventory management, stock movements, and reports.
  - **Staff**: View items, register stock-in/out, and handle equipment borrowing.
- **Account Actions**:
  - Add new accounts with role and department assignments.
  - Edit user profiles and reset passwords.
  - Deactivate & reactivate staff accounts without deleting transaction history.
  - Permanently delete users with confirmation modal (foreign key protected via `ON DELETE SET NULL`).
- **Security**:
  - NextAuth.js JWT session strategy.
  - Secure password hashing with `bcryptjs`.
  - Next.js 16 `proxy.js` route protection guarding all `/dashboard/*` paths.
  - Protected primary administrator account (cannot be deactivated or deleted).

### 8. Bilingual (EN / KH) & Mobile First
- **Instant Language Toggle**: Complete bilingual support throughout the application (English and ភាសាខ្មែរ Khmer).
- **Responsive Mobile UX**: Mobile card layouts, slide-out hamburger drawer, and viewport-safe portal modals (`createPortal`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.4.6](https://nextjs.org/) (App Router, Turbopack) |
| **UI Library** | [React 19.3.0](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Glassmorphism design system |
| **Database** | [MySQL](https://www.mysql.com/) via `mysql2` connection pooling |
| **Authentication** | [NextAuth.js v4](https://next-auth.js.org/) (Credentials Provider, JWT, bcrypt) |
| **Cloud Storage** | [Cloudinary](https://cloudinary.com/) (Product & item photo uploads) |
| **Icons** | [Lucide React](https://lucide.dev/) (Modern SVG icon set) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Export Utilities**| [SheetJS (xlsx)](https://sheetjs.com/) & [File-Saver](https://github.com/eligrey/FileSaver.js) |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+ recommended
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Database**: MySQL Server 8.0+ running locally or remotely

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Innolab inventory"
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=innolab_inventory

# NextAuth Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=innolab-secret-key-change-in-production

# Cloudinary (Optional - for permanent cloud image hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application Info
NEXT_PUBLIC_APP_NAME="InnoLab IMS"
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 4. Database Setup
Run the database initialization script to create the schema and seed initial data:

```bash
node scripts/setup-db.js
```
*(Alternatively, import the SQL schema file directly from `src/lib/schema.sql` into MySQL).*

### 5. Run Development Server
```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Unauthenticated visits will automatically redirect to the login screen.

---

## Project Structure

```
Innolab inventory/
├── public/                     # Static assets (logos, illustrations)
├── scripts/                    # Utility scripts (build-css, db setup, image migration)
├── src/
│   ├── app/
│   │   ├── api/                # REST API route handlers
│   │   │   ├── auth/           # NextAuth callback routes
│   │   │   ├── inventory/      # Inventory CRUD & image handlers
│   │   │   ├── categories/     # Category endpoints
│   │   │   ├── stock-in/       # Inbound stock handlers
│   │   │   ├── stock-out/      # Outbound stock handlers
│   │   │   ├── borrow/         # Equipment borrowing endpoints
│   │   │   ├── sme-products/   # SME samples endpoints
│   │   │   ├── suppliers/      # Supplier directory handlers
│   │   │   ├── reports/        # Analytics & metrics aggregation
│   │   │   ├── activity/       # Audit trail query endpoints
│   │   │   ├── users/          # User management CRUD endpoints
│   │   │   └── upload/         # Cloudinary file upload & delete
│   │   ├── dashboard/          # Protected dashboard app routes
│   │   │   ├── inventory/      # Inventory page
│   │   │   ├── categories/     # Categories management
│   │   │   ├── stock-in/       # Inbound movements
│   │   │   ├── stock-out/      # Outbound movements
│   │   │   ├── borrow/         # Lending & returns
│   │   │   ├── sme-products/   # SME showcase
│   │   │   ├── suppliers/      # Suppliers page
│   │   │   ├── reports/        # Reporting & charts
│   │   │   ├── activity/       # Activity log
│   │   │   ├── users/          # User management
│   │   │   └── settings/       # System preferences
│   │   ├── login/              # InnoLab branded split-card login page
│   │   ├── layout.js           # Root layout with Auth & Theme providers
│   │   └── globals.css         # Global styles & Tailwind v4 theme
│   ├── components/
│   │   ├── layout/             # TopNav, Sidebar, DashboardLayout
│   │   ├── providers/          # AuthProvider (SessionProvider)
│   │   └── ui/                 # Reusable UI (Modal, Button, Input, Table, etc.)
│   ├── lib/
│   │   ├── auth.js             # NextAuth configuration
│   │   ├── db.js               # MySQL connection pool & SQL query helpers
│   │   ├── schema.sql          # Complete MySQL database schema
│   │   ├── LanguageContext.js  # Bilingual context provider
│   │   └── translations.js     # English & Khmer string dictionaries
│   └── proxy.js                # Next.js 16 route protection middleware
├── package.json
└── README.md
```

---

## Build & Production Deployment

To create an optimized production build:

```bash
pnpm build
pnpm start
```

---

## License

Developed for the **InnoLab Innovation & SME Incubation Hub** (Kampong Thom). All rights reserved.
