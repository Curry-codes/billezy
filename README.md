# BillEzy — Scan and Shop

A complete React + Firebase billing and inventory management system with Razorpay checkout and Twilio SMS integration.

## Project Structure

```
src/
  components/
    Welcome.tsx         # Landing page
    Cart.tsx            # Shopping cart (scan/add by TagUID)
    Checkout.tsx        # Razorpay integration
    FinalBill.tsx       # User details + SMS trigger
    InventoryLogin.tsx  # Admin/Staff auth
    InventoryDashboard.tsx  # Admin CRUD, staff view
    NavBar.tsx          # Navigation links
  firebase.ts           # Firebase config (uses Vite env vars)
  App.tsx               # Routes
  main.tsx              # Entry point
  index.css             # Styles
functions/
  index.js              # Razorpay payment verification + Twilio SMS
  package.json
database.rules.json     # Realtime Database access control
firestore.rules         # Locks unused client-side Firestore access
scripts/
  seedRealtimeDatabase.cjs # Seed sample products
  createAuthUsers.cjs   # Provision staff accounts and trusted roles
.env.example            # Environment variables template
```

## Setup

### 1. Create Firebase Project

- Go to https://console.firebase.google.com
- Create a new project
- Enable Realtime Database and Authentication.
- Enable Email/Password and Anonymous sign-in providers in Authentication.
- Cloud Functions deployment requires the Blaze (pay-as-you-go) plan.
- If using the Admin scripts locally, create a service account key and store it outside the repository. Set `GOOGLE_APPLICATION_CREDENTIALS` to its path.

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in the `VITE_FIREBASE_*` values from Firebase project settings, including the Realtime Database URL. These frontend values are public configuration, not credentials. Never add service-account JSON, Razorpay secrets, or Twilio credentials to frontend environment variables or GitHub.

### 3. Install Dependencies

```bash
npm install
npm run functions:install
```

### 4. Seed sample products (optional)

```bash
npm run seed
```

This writes sample products to Realtime Database. Set `FIREBASE_DATABASE_URL` to the URL from Firebase Console and set `GOOGLE_APPLICATION_CREDENTIALS` to the Admin SDK key path before running the script:

- TAG1001: T-Shirt Blue (₹499)
- TAG1002: Sneakers White (₹2499)
- TAG1003: Jeans Black (₹1199)

### 5. Provision inventory users

Create the admin and/or staff accounts with unique passwords in Firebase Authentication. Then assign trusted custom claims (set one or both email variables):

```bash
ADMIN_EMAIL=admin@your-domain.example \
npm run create-auth
```

For a staff account, use `STAFF_EMAIL=staff@your-domain.example` instead. The script sets the `role` custom claim (`admin` or `staff`) used by the app and database rules. Supply a service account with `GOOGLE_APPLICATION_CREDENTIALS`; keep its key outside the repository. After assigning a role, the user must sign out and back in to refresh their ID token. Remove any old plaintext credentials from the Realtime Database `users` path and any legacy Firestore user documents.

### 6. Configure secrets and deploy rules/functions

```bash
firebase login
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM
firebase deploy --only database,firestore,functions
```

Enter values only into Firebase CLI prompts. Razorpay payment is verified by Cloud Functions; there is no client-side payment simulation. Twilio secrets are required to send receipts. If SMS is not needed, remove the Twilio secrets from the function configuration before deploying.

The Realtime Database rules allow public reads of the product catalog, restrict inventory changes to the admin role, restrict sales/history to staff/admin and an order's owner, and block client writes to orders. Admin SDK Cloud Functions perform payment/order writes. Firestore client access is denied because the app no longer uses it for checkout.

### 7. Run Frontend Dev Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing the App

### Billing Flow

1. Click **Start Shopping** on Welcome page
2. Scan products by TagUID (from seeded products)
3. Click **Proceed to Checkout**
4. Pay through Razorpay Checkout
5. Enter name and phone to send the receipt using Twilio

> **Arduino / RFID Integration**  
> If you're pushing scanned UIDs from an Arduino (see
> `TESTING_WITH_DUMMY_DATA.md` or the sample sketch), the app
> listens to `/scannedItems` in the Realtime Database and will
> display incoming tags in the cart view. Reads require Firebase
> Authentication; writes require an authenticated staff/admin role.
> Each child under `/scannedItems` should include a `tagId` or `tagUID`
> matching a product tag. The cart displays Firebase read/auth errors and
> reports scanned tags that do not match an inventory product.
> Never embed an Admin SDK service-account key in Arduino firmware.

### Inventory Flow

1. Click **Inventory** in the navbar and sign in with a provisioned Firebase Auth account.
2. **Admin only**:
   - View products table
   - Click **Add product** to create new item
   - Click **Edit** to modify existing product
   - Click **Assign Tag** to change RFID tag
   - Click **Delete** for undo-able deletion
3. **Staff only**:
   - View read-only product list

## Key Features Implemented

✅ **Billing UI**

- Welcome page with branding
- Shopping cart with TagUID scanning
- Razorpay checkout with server-side order creation and payment verification
- Payment confirmation + user details capture
- Automatic product deactivation on successful order

✅ **Inventory UI**

- Login with Firebase Auth (role-based: admin/staff)
- Admin: Full CRUD for products
- Admin: Tag UID assignment workflow
- Admin: Undo-able delete with 8-second timer
- Staff: Read-only product view
- Dashboard stats placeholder

✅ **Backend**

- Realtime Database schema (products, orders, scans)
- Cloud Functions: Razorpay verification and Twilio SMS delivery
- Automatic order creation + inventory deactivation
- Demo seeding scripts

✅ **Integrations**

- Razorpay: Checkout (requires Razorpay account keys and Cloud Functions)
- Twilio: SMS delivery (requires Twilio credentials)
- Firebase Auth: Email/password with custom roles

## Notes

- **Razorpay**: No simulated successful payments; Functions verify the signature and captured payment with Razorpay before marking an order paid.
- **Twilio**: SMS only sends if Cloud Functions are deployed and the required Firebase secrets are configured.
- **Service Account**: Required for the Admin SDK seed and role-provisioning scripts; keep the key outside the repository.
- **Styling**: Uses minimal inline styles. Customize in `src/index.css`.

## Scripts

```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run seed             # Seed Realtime Database with sample products
npm run create-auth      # Assign admin/staff custom claims
npm run functions:install # Install functions dependencies
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
