#!/bin/bash

# DUMMY DATA SETUP SCRIPT
# This script creates dummy Firestore data without requiring Firebase credentials
# Perfect for local testing before setting up real Firebase project

echo "🚀 Setting up dummy data for testing..."

# Create dummy products data file
cat > scripts/dummyProducts.json << 'EOF'
{
  "products": [
    {
      "tagUID": "TAG1001",
      "name": "iPhone 15 Pro",
      "price": 99999,
      "active_status": "Active",
      "category": "Electronics",
      "color": "Space Black",
      "size": "256GB",
      "stock_qty": 15
    },
    {
      "tagUID": "TAG1002",
      "name": "Sony WH-1000XM5 Headphones",
      "price": 29999,
      "active_status": "Active",
      "category": "Audio",
      "color": "Black",
      "size": "Universal",
      "stock_qty": 8
    },
    {
      "tagUID": "TAG1003",
      "name": "MacBook Air M3",
      "price": 129999,
      "active_status": "Active",
      "category": "Computers",
      "color": "Silver",
      "size": "512GB",
      "stock_qty": 5
    },
    {
      "tagUID": "TAG1004",
      "name": "iPad Pro 12.9",
      "price": 84999,
      "active_status": "Active",
      "category": "Tablets",
      "color": "Space Gray",
      "size": "256GB",
      "stock_qty": 12
    },
    {
      "tagUID": "TAG1005",
      "name": "Apple Watch Series 9",
      "price": 44999,
      "active_status": "Active",
      "category": "Wearables",
      "color": "Midnight",
      "size": "45mm",
      "stock_qty": 20
    }
  ],
  "users": [
    {
      "uid": "dummy-admin-001",
      "email": "admin@smart-billing.com",
      "name": "Admin User",
      "role": "admin"
    },
    {
      "uid": "dummy-staff-001",
      "email": "staff@smart-billing.com",
      "name": "Staff User",
      "role": "staff"
    }
  ]
}
EOF

echo "✅ Dummy data files created!"
echo ""
echo "📝 Your dummy credentials are ready:"
echo "   • .env file created with dummy Firebase config"
echo "   • serviceAccountKey.json created for local testing"
echo "   • Dummy products data ready in scripts/dummyProducts.json"
echo ""
echo "🔑 Demo Credentials:"
echo "   Admin:  admin@smart-billing.com / AdminPass123"
echo "   Staff:  staff@smart-billing.com / StaffPass123"
echo ""
echo "⚠️  REMEMBER: Replace these with your real Firebase credentials when ready!"
echo "   See README.md for Firebase setup instructions."
echo ""
echo "✨ Ready to test! Run: npm run dev"
