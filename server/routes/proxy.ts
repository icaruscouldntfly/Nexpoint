import { RequestHandler } from "express";

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? "https://nexpoint.workers.dev";

async function proxyRequest(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      console.error(`Worker returned ${response.status}:`, text);
      return { error: true, status: response.status, data: text };
    }

    const data = await response.json();
    return { error: false, status: response.status, data };
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return { error: true, status: 500, data: { error: "Failed to reach worker" } };
  }
}

export const getProducts: RequestHandler = async (req, res) => {
  const result = await proxyRequest(`${CLOUDFLARE_WORKER_URL}/api/products`);
  if (result.error) {
    return res.status(result.status).json(typeof result.data === 'string' ? { error: result.data } : result.data);
  }
  res.json(result.data);
};

export const getCategories: RequestHandler = async (req, res) => {
  const result = await proxyRequest(`${CLOUDFLARE_WORKER_URL}/api/categories`);
  if (result.error) {
    return res.status(result.status).json(typeof result.data === 'string' ? { error: result.data } : result.data);
  }
  res.json(result.data);
};

export const getOrders: RequestHandler = async (req, res) => {
  const result = await proxyRequest(`${CLOUDFLARE_WORKER_URL}/api/orders`);
  if (result.error) {
    return res.status(result.status).json(typeof result.data === 'string' ? { error: result.data } : result.data);
  }
  res.json(result.data);
};

export const createOrder: RequestHandler = async (req, res) => {
  const result = await proxyRequest(`${CLOUDFLARE_WORKER_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  if (result.error) {
    return res.status(result.status).json(typeof result.data === 'string' ? { error: result.data } : result.data);
  }
  res.json(result.data);
};

export const updateProductStock: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const result = await proxyRequest(`${CLOUDFLARE_WORKER_URL}/api/products/${id}/stock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  if (result.error) {
    return res.status(result.status).json(typeof result.data === 'string' ? { error: result.data } : result.data);
  }
  res.json(result.data);
};
