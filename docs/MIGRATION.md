# Store-Product Relationship Migration

## Target Store ID
All products should be associated with: `6984f69469a68016b608074b`

## Current Status
The Prisma schema already supports the store-product relationship:
- `Product` model has a required `storeId` field
- `Store` model has a one-to-many relationship with `Product`
- The application UI (`src/app/page.tsx`) correctly passes `storeId` when creating products

## Migration Options

### Option 1: MongoDB Shell (Recommended)
If you have direct access to MongoDB, run this command:

```javascript
db.products.updateMany(
  { storeId: { $ne: "6984f69469a68016b608074b" } },
  { $set: { storeId: "6984f69469a68016b608074b" } }
)
```

### Option 2: MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database: `little-big-entrepreneur`
3. Navigate to the `products` collection
4. Use the Filter: `{ "storeId": { "$ne": "6984f69469a68016b608074b" } }`
5. Select all matching documents
6. Update them with: `{ "$set": { "storeId": "6984f69469a68016b608074b" } }`

### Option 3: API Endpoint (Create if needed)
Create a one-time migration endpoint at `/api/migrate-products` that updates all products.

## Verification
After migration, verify with this MongoDB query:
```javascript
db.products.find({ storeId: { $ne: "6984f69469a68016b608074b" } }).count()
```
This should return `0` if all products are migrated.

## Application Integration
The application is already configured to:
- ✅ Fetch products filtered by `storeId` (see `src/app/api/products/route.ts`)
- ✅ Create new products with the active store's ID (see `src/app/page.tsx`)
- ✅ Display the store name in the dashboard header

No code changes are needed once the data migration is complete.
