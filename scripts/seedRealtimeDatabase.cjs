/**
 * Seed Realtime Database with sample products.
 * Usage:
 * 1. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path
 *    stored outside the repository.
 * 2. Run: `npm run seed`
 */
const admin = require("firebase-admin");
const { getDatabase } = require("firebase-admin/database");

try {
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    throw new Error("Set FIREBASE_DATABASE_URL to your Realtime Database URL.");
  }
  admin.initializeApp({ databaseURL });
} catch (e) {
  console.error(
    "Failed to initialize admin SDK. Ensure service account is present.",
    e,
  );
  process.exit(1);
}

const db = getDatabase();

async function seed() {
  console.log("Seeding products...");
  const products = [
    {
      tagUID: "TAG1001",
      name: "T-Shirt Blue",
      price: 499,
      active_status: "Active",
      category: "Apparel",
      color: "Blue",
      size: "M",
      stock_qty: 10,
    },
    {
      tagUID: "TAG1002",
      name: "Sneakers White",
      price: 2499,
      active_status: "Active",
      category: "Footwear",
      color: "White",
      size: "9",
      stock_qty: 5,
    },
    {
      tagUID: "TAG1003",
      name: "Jeans Black",
      price: 1199,
      active_status: "Active",
      category: "Apparel",
      color: "Black",
      size: "32",
      stock_qty: 8,
    },
  ];

  for (const p of products) {
    await db.ref(`products/${p.tagUID}`).set({
      tagId: p.tagUID,
      productName: p.name,
      price: p.price,
      active_status: p.active_status,
      stockQty: p.stock_qty,
    });
    console.log("Written", p.tagUID);
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
