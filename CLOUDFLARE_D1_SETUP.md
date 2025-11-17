# Cloudflare D1 Migration Setup Guide

This guide will help you migrate your Nexpoint application from storing data in localStorage (the browser's local storage) to using Cloudflare D1 (a cloud database). This means your products, orders, and inventory data will be stored in the cloud instead of just on individual browsers.

## Why Migrate to D1?

- **Cloud Database**: Data persists across all users and devices
- **Real-time Updates**: All users see the same product stock
- **Scalability**: Can handle more users and orders
- **Professional**: Better suited for production/business use

## Prerequisites

Before starting, you need:

1. **Cloudflare Account** - Create one at https://dash.cloudflare.com
2. **Wrangler CLI** - Cloudflare's command-line tool
3. **Node.js** - Already installed if you're using Builder.io

## Step-by-Step Setup

### Step 1: Install Wrangler CLI

This is a one-time setup. Run this command in the Builder.io terminal:

```bash
npm install -g wrangler
```

After installation, verify it worked:
```bash
wrangler --version
```

### Step 2: Login to Cloudflare

Connect your Cloudflare account to Wrangler:

```bash
wrangler login
```

This will open a browser window asking you to authorize Wrangler. Click "Allow" and you'll get a confirmation.

### Step 3: Create D1 Database

Create a new D1 database called `nexpoint_db`:

```bash
wrangler d1 create nexpoint_db
```

**Important**: Copy the output you see. It will show something like:
```
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

You'll use this in the next step.

### Step 4: Update wrangler.toml

Open the file `wrangler.toml` in Builder.io and update it with your database ID:

```toml
name = "nexpoint"
type = "service"
main = "src/index.ts"
compatibility_date = "2024-11-15"

[[d1_databases]]
binding = "DB"
database_name = "nexpoint_db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Replace with your ID from Step 3

[env.production]
route = "https://nexpoint.shop/*"
```

### Step 5: Create Database Tables and Data

Run these two migration files to set up your database structure and seed it with product data:

```bash
wrangler d1 execute nexpoint_db --file=migrations/0001_init_schema.sql
```

Wait for that to complete, then run:

```bash
wrangler d1 execute nexpoint_db --file=migrations/0002_seed_products.sql
```

**What this does:**
- Creates a `products` table with all your 76 products (Euro Zyn, American Zyn, VELO, Whitefox)
- Creates an `orders` table to store all orders from all customers
- Sets up indexes for fast database lookups

### Step 6: Deploy Cloudflare Worker

Deploy your API to Cloudflare:

```bash
wrangler publish
```

This uploads your Worker code (the API endpoints) to Cloudflare's servers. When it completes, you'll see:

```
✓ Uploaded 1 script
Deployed to https://nexpoint.workers.dev
```

Note the URL - this is your test URL. We'll point nexpoint.shop to this later.

### Step 7: Configure Your Domain

In the Cloudflare dashboard:

1. Go to https://dash.cloudflare.com
2. Select your account → Workers & Pages
3. Click your "nexpoint" worker
4. Go to "Settings" → "Domains & Routes"
5. Click "Add route"
6. Enter: `https://nexpoint.shop/*`
7. Select your "nexpoint" worker from the dropdown

This makes `https://nexpoint.shop` point to your Cloudflare Worker API.

### Step 8: Test Everything Works

Check that your database has products:

```bash
wrangler d1 execute nexpoint_db --command="SELECT COUNT(*) as total FROM products;"
```

You should see: `total: 76` (your 76 products)

Test the API endpoint by opening this in your browser:
```
https://nexpoint.workers.dev/api/products
```

You should see JSON with all your products.

## How It Works Now

### Before (localhost/current)
```
User → Browser → localStorage (data only on that computer)
```

### After (D1/Cloudflare)
```
User #1 → 
User #2 → API → Cloudflare D1 Database ← Everyone uses same data
User #3 →
```

## API Endpoints Your App Now Uses

### Get All Products
```
GET /api/products
Response: [
  { "id": "euro-0", "name": "Mini Cool Mint", "strength": "3mg", "stock": 200, ... },
  ...
]
```

### Get All Categories  
```
GET /api/categories
Response: ["Euro Zyn Flavours", "American Zyn Flavours", "VELO Flavour", "Whitefox Flavour"]
```

### Get All Orders
```
GET /api/orders
Response: [
  {
    "orderNumber": "ORD-1234567890",
    "customerName": "John Doe",
    "storeName": "My Store",
    "email": "john@example.com",
    "items": [...],
    "timestamp": "01/15/2024, 14:30:45"
  },
  ...
]
```

### Create New Order
```
POST /api/orders
Body: {
  "orderNumber": "ORD-1234567890",
  "customerName": "John Doe",
  "storeName": "My Store",
  "email": "john@example.com",
  "phone": "+1234567890",
  "items": [
    { "id": "euro-0", "name": "Mini Cool Mint", "strength": "3mg", "quantity": 5 }
  ],
  "timestamp": "01/15/2024, 14:30:45"
}
```

### Update Product Stock
```
PUT /api/products/{productId}/stock
Body: { "quantity": 5 }
```

## Email Configuration

Your app still sends emails via Gmail. Set these environment variables in Wrangler:

In your `wrangler.toml`, add under `[env.production]`:

```toml
[env.production]
vars = {
  EMAIL_USER = "nexpointinvoice@gmail.com",
  EMAIL_PASS = "fsrr cvkf uqoc oqgk"
}
```

Then deploy with:
```bash
wrangler publish --env production
```

## Troubleshooting

### "Database not found" error
- Check that your database ID in `wrangler.toml` is correct
- Run: `wrangler d1 list` to see all your databases

### "No tables found" error
- Run the migration files again:
  ```bash
  wrangler d1 execute nexpoint_db --file=migrations/0001_init_schema.sql
  wrangler d1 execute nexpoint_db --file=migrations/0002_seed_products.sql
  ```

### Orders not showing on dashboard
- Check that `/api/orders` returns data: `wrangler d1 execute nexpoint_db --command="SELECT * FROM orders;"`
- Make sure orders are being sent to the API (check network tab in browser DevTools)

### Product stock not updating
- Verify the API is being called when you place an order
- Check server logs: `wrangler tail`

## Local Development

To test locally before deploying:

```bash
wrangler dev
```

This runs your Cloudflare Worker on `http://localhost:8787` with a local copy of your D1 database. Changes to the local database won't affect your production database.

## Managing Your Database

### View all products:
```bash
wrangler d1 execute nexpoint_db --command="SELECT * FROM products LIMIT 10;"
```

### View recent orders:
```bash
wrangler d1 execute nexpoint_db --command="SELECT * FROM orders ORDER BY timestamp DESC LIMIT 5;"
```

### Check product stock:
```bash
wrangler d1 execute nexpoint_db --command="SELECT name, strength, stock FROM products WHERE stock < 50;"
```

### Delete all orders (reset for testing):
```bash
wrangler d1 execute nexpoint_db --command="DELETE FROM orders;"
```

## Switching from Netlify to Cloudflare

Once everything is working:

1. Keep your domain pointing to Cloudflare (via Step 7)
2. You can remove the Netlify deployment
3. All traffic will go through Cloudflare Workers instead

## Security Notes

- Never commit `wrangler.toml` with real email passwords to GitHub
- Use Wrangler's environment variables in production
- D1 is only accessible from your Cloudflare Worker, not directly from the internet

## Summary of Files Changed

For reference, these files were modified to use the D1 API:

1. `client/lib/products.ts` - Fetches products from `/api/products`
2. `client/lib/categories.ts` - Fetches categories from `/api/categories`  
3. `client/pages/Index.tsx` - Sends orders to `/api/orders`, updates stock
4. `client/pages/Dashboard.tsx` - Fetches all orders from `/api/orders`
5. `src/worker.ts` - Your Cloudflare Worker API code
6. `wrangler.toml` - Cloudflare configuration

## Next Steps After Deployment

1. Test the app at https://nexpoint.shop
2. Place a test order on the homepage
3. Check that it appears on the admin dashboard
4. Verify order emails are sent correctly
5. Monitor orders with: `wrangler d1 execute nexpoint_db --command="SELECT COUNT(*) FROM orders;"`

## Getting Help

If something goes wrong:

1. Check server logs: `wrangler tail`
2. Test API manually: Visit https://nexpoint.shop/api/products
3. Check database: `wrangler d1 execute nexpoint_db --command="SELECT * FROM products LIMIT 1;"`
4. Check Cloudflare dashboard: https://dash.cloudflare.com

Good luck! 🚀
