# 🪔 Navratri Pass Reseller Management Dashboard

A complete, clean, modern, SaaS-style internal management web application built for personal Navratri Pass Resellers to manage B2C ticket sales, prices, net profits, delivery statuses, and dynamic pass lists with **Google Sheets** as the core database.

---

## 🌟 Features & Business Context

- **Private Admin Dashboard Only**: No customer registration, checkout, payment gateway, or B2B functionality.
- **Google Sheets Database**: Syncs all sales records directly into a 15-column `SALES` Google Sheet and reads dropdown options from a `LISTS` sheet tab.
- **Live Automated Calculations**:
  - `Total Buying Cost` = Quantity × Buying Price / Pass
  - `Total Selling Amount` = Quantity × Selling Price / Pass
  - `Profit` = Total Selling Amount − Total Buying Cost
- **Pass Delivery Tracker**: Color-coded badges for `Yes` (Green), `No` (Red), and `Partially` (Orange).
- **Interactive Visual Analytics**: Interactive Recharts graphs for Sales by Navratri Day (Days 1–9), Pass Category Breakdown, and Revenue vs. Profit.
- **Full CRUD Management**: View modal with full details, Edit modal (updates Google Sheet row without duplicate creation), and Delete modal with confirmation popup.
- **Dropdown Options Settings**: Full management for Pass Names, Categories, Delivery Methods, and Navratri Days synced to Google Sheets.
- **Rupee & Date Formatting**: Indian Rupee (`₹1,999`) formatting and standard `DD-MM-YYYY` date handling.
- **Responsive SaaS UI**: Built with Tailwind CSS, Lucide icons, skeleton loaders, and toast notifications.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React icons.
- **Backend**: Node.js, Express.js, JWT Authentication.
- **Database / API**: Google Sheets API v4 (`googleapis` npm package).

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd server
npm install
```

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure `server/.env`:
```env
PORT=5000
AUTH_SECRET=navratri_secret_jwt_key_2026_reseller_secure
ADMIN_EMAIL=admin@navratri.com
ADMIN_PASSWORD=admin123

# Google Sheets Credentials (Optional for local persistent demo mode)
GOOGLE_SHEET_ID=your_google_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```

Start the backend:
```bash
npm run dev
# Server will run at http://localhost:5000
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
# Frontend will run at http://localhost:3000
```

Default Admin Login:
- **Email**: `admin@navratri.com`
- **Password**: `admin123`

---

## 📊 Google Sheets Configuration Guide

Follow these exact steps to connect your spreadsheet:

### Step 1: Create the Google Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Rename the spreadsheet to `Navratri Sales Master`.

### Step 2: Create the `SALES` Tab
1. Rename the first sheet tab to **`SALES`** (case-sensitive).
2. Add these exact 15 headers in Row 1 (Columns A to O):
   - **Col A**: Customer Name
   - **Col B**: Mobile Number
   - **Col C**: Pass Name
   - **Col D**: Pass Category
   - **Col E**: Quantity
   - **Col F**: Buying Price / Pass
   - **Col G**: Selling Price / Pass
   - **Col H**: Total Buying Cost
   - **Col I**: Total Selling Amount
   - **Col J**: Profit
   - **Col K**: Pass Given?
   - **Col L**: Pass Delivery Method
   - **Col M**: Date Sold
   - **Col N**: Navratri Day
   - **Col O**: Notes

### Step 3: Create the `LISTS` Tab
1. Create a second sheet tab named **`LISTS`** (case-sensitive).
2. Add these headers in Row 1 (Columns A to E):
   - **Col A**: PASS NAMES
   - **Col B**: PASS CATEGORIES
   - **Col C**: PASS GIVEN STATUS
   - **Col D**: PASS DELIVERY METHODS
   - **Col E**: NAVRATRI DAYS

### Step 4: Create Google Cloud Project & Enable API
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Navratri-Pass-Reseller`).
3. Search for **Google Sheets API** in the API Library and click **Enable**.

### Step 5: Create Service Account Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > Service Account**.
3. Fill in name `sheets-reseller-bot` and click **Create and Continue**.
4. Click on the created Service Account email to open its details.
5. Navigate to the **Keys** tab -> **Add Key > Create New Key**.
6. Select **JSON** and click **Create**. The key file will download automatically.

### Step 6: Share Spreadsheet with Service Account
1. Open the downloaded JSON key file.
2. Copy the `client_email` value (e.g., `sheets-reseller-bot@navratri-project.iam.gserviceaccount.com`).
3. Open your Google Sheet, click **Share** at the top right.
4. Paste the Service Account email and grant **Editor** access.

### Step 7: Configure Environment Variables
1. Copy the Spreadsheet ID from your browser URL:
   `https://docs.google.com/spreadsheets/d/`**`YOUR_SPREADSHEET_ID_HERE`**`/edit`
2. Update `server/.env` with `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY`.

---

## 🏗️ Production Build

To build the client application for production deployment:
```bash
cd client
npm run build
```
The optimized production bundle will be generated in `client/dist`.

---

## 🔒 Security & Data Integrity

- Google Service Account keys and secrets are handled exclusively inside the Express backend environment.
- No private keys or secret variables are ever sent to or compiled into client JavaScript.
- All sales routes require JWT authorization headers.
