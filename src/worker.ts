interface Env {
  DB: D1Database;
  EMAIL_USER: string;
  EMAIL_PASS: string;
}

interface OrderItem {
  id: string;
  name: string;
  strength: string;
  quantity: number;
}

interface OrderRequest {
  orderNumber: string;
  customerName: string;
  storeName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  timestamp: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/products
      if (method === 'GET' && path === '/api/products') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, category, strength, stock, multipleOf, status FROM products ORDER BY category, name'
        ).all();

        return new Response(JSON.stringify(results || []), {
          headers: corsHeaders,
        });
      }

      // GET /api/categories
      if (method === 'GET' && path === '/api/categories') {
        const { results } = await env.DB.prepare(
          'SELECT DISTINCT category FROM products ORDER BY category'
        ).all();

        const categories = (results || []).map((r: any) => r.category);

        return new Response(JSON.stringify(categories), {
          headers: corsHeaders,
        });
      }

      // GET /api/orders
      if (method === 'GET' && path === '/api/orders') {
        const { results } = await env.DB.prepare(
          'SELECT orderNumber, customerName, storeName, email, phone, items, timestamp FROM orders ORDER BY timestamp DESC LIMIT 1000'
        ).all();

        const orders = (results || []).map((order: any) => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        }));

        return new Response(JSON.stringify(orders), {
          headers: corsHeaders,
        });
      }

      // POST /api/orders
      if (method === 'POST' && path === '/api/orders') {
        const data: OrderRequest = await request.json();
        const { orderNumber, customerName, storeName, email, phone, items, timestamp } = data;

        // Validate required fields
        if (!orderNumber || !customerName || !storeName || !email || !phone || !items || !timestamp) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Begin transaction
        try {
          // Update product stocks
          for (const item of items) {
            await env.DB.prepare(
              'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
            ).bind(item.quantity, item.id).run();
          }

          // Insert order
          await env.DB.prepare(
            `INSERT INTO orders (orderNumber, customerName, storeName, email, phone, items, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            orderNumber,
            customerName,
            storeName,
            email,
            phone,
            JSON.stringify(items),
            timestamp
          ).run();

          // Send email (optional - requires external email service)
          if (env.EMAIL_USER && env.EMAIL_PASS) {
            // Email sending would be handled by a separate service/function
            // For now, just log it
            console.log(`Order ${orderNumber} created, email would be sent to ${email}`);
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Order created successfully!',
            orderNumber,
          }), {
            headers: corsHeaders,
          });
        } catch (error) {
          console.error('Error creating order:', error);
          return new Response(JSON.stringify({ error: 'Failed to create order' }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      }

      // PUT /api/products/:id/stock
      if (method === 'PUT' && path.startsWith('/api/products/') && path.endsWith('/stock')) {
        const productId = path.split('/')[3];
        const { quantity } = await request.json() as { quantity: number };

        await env.DB.prepare(
          'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
        ).bind(quantity, productId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders,
        });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
