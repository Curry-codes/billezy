// Local Testing Configuration for Smart Billing
// This file simulates Firestore data without requiring Firebase credentials

export const DUMMY_PRODUCTS = [
  {
    id: "TAG1001",
    tagUID: "TAG1001",
    name: "iPhone 15 Pro",
    price: 99999,
    active_status: "Active",
    category: "Electronics",
    color: "Space Black",
    size: "256GB",
    stock_qty: 15,
  },
  {
    id: "TAG1002",
    tagUID: "TAG1002",
    name: "Sony WH-1000XM5 Headphones",
    price: 29999,
    active_status: "Active",
    category: "Audio",
    color: "Black",
    size: "Universal",
    stock_qty: 8,
  },
  {
    id: "TAG1003",
    tagUID: "TAG1003",
    name: "MacBook Air M3",
    price: 129999,
    active_status: "Active",
    category: "Computers",
    color: "Silver",
    size: "512GB",
    stock_qty: 5,
  },
  {
    id: "TAG1004",
    tagUID: "TAG1004",
    name: "iPad Pro 12.9",
    price: 84999,
    active_status: "Active",
    category: "Tablets",
    color: "Space Gray",
    size: "256GB",
    stock_qty: 12,
  },
  {
    id: "TAG1005",
    tagUID: "TAG1005",
    name: "Apple Watch Series 9",
    price: 44999,
    active_status: "Active",
    category: "Wearables",
    color: "Midnight",
    size: "45mm",
    stock_qty: 20,
  },
];

export const DUMMY_USERS = [
  {
    uid: "dummy-admin-001",
    email: "admin@smart-billing.com",
    name: "Admin User",
    role: "admin",
  },
  {
    uid: "dummy-staff-001",
    email: "staff@smart-billing.com",
    name: "Staff User",
    role: "staff",
  },
];

export const DUMMY_ORDERS = [
  {
    id: "ORDER001",
    items: [{ tagUID: "TAG1001", name: "iPhone 15 Pro", price: 99999 }],
    total: 99999,
    status: "paid",
    createdAt: "2026-02-26T10:30:00Z",
    billSentAttempted: false,
  },
  {
    id: "ORDER002",
    items: [
      { tagUID: "TAG1002", name: "Sony Headphones", price: 29999 },
      { tagUID: "TAG1005", name: "Apple Watch", price: 44999 },
    ],
    total: 74998,
    status: "paid",
    createdAt: "2026-02-26T11:15:00Z",
    billSentAttempted: true,
    billSentAt: "2026-02-26T11:16:00Z",
  },
];

// Test Helper: Store dummy data in localStorage
export function initializeDummyData() {
  localStorage.setItem("dummyProducts", JSON.stringify(DUMMY_PRODUCTS));
  localStorage.setItem("dummyUsers", JSON.stringify(DUMMY_USERS));
  localStorage.setItem("dummyOrders", JSON.stringify(DUMMY_ORDERS));
  console.log("✅ Dummy data initialized in localStorage");
}

// Test Helper: Clear all dummy data
export function clearDummyData() {
  localStorage.removeItem("dummyProducts");
  localStorage.removeItem("dummyUsers");
  localStorage.removeItem("dummyOrders");
  console.log("🗑️ Dummy data cleared");
}

// Test Helper: Get dummy product by tagUID
export function getDummyProduct(tagUID: string) {
  return DUMMY_PRODUCTS.find((p) => p.tagUID === tagUID);
}

// Test Helper: Get all dummy products
export function getDummyProducts() {
  return DUMMY_PRODUCTS;
}

// Test Helper: Add dummy product
export function addDummyProduct(product: any) {
  DUMMY_PRODUCTS.push({
    ...product,
    id: product.tagUID,
  });
}

// Test Helper: Update dummy product
export function updateDummyProduct(tagUID: string, updates: any) {
  const index = DUMMY_PRODUCTS.findIndex((p) => p.tagUID === tagUID);
  if (index !== -1) {
    DUMMY_PRODUCTS[index] = { ...DUMMY_PRODUCTS[index], ...updates };
  }
}

// Test Helper: Delete dummy product
export function deleteDummyProduct(tagUID: string) {
  const index = DUMMY_PRODUCTS.findIndex((p) => p.tagUID === tagUID);
  if (index !== -1) {
    DUMMY_PRODUCTS.splice(index, 1);
  }
}

export default {
  DUMMY_PRODUCTS,
  DUMMY_USERS,
  DUMMY_ORDERS,
  initializeDummyData,
  clearDummyData,
  getDummyProduct,
  getDummyProducts,
  addDummyProduct,
  updateDummyProduct,
  deleteDummyProduct,
};
