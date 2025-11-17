export interface Product {
  id: string;
  name: string;
  category: string;
  strength: string;
  stock: number;
  multipleOf: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const API_BASE = '/api';

export async function getOrInitializeProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function updateProductStock(productId: string, quantityReduction: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: quantityReduction }),
    });
    if (!response.ok) throw new Error('Failed to update stock');
  } catch (error) {
    console.error('Error updating stock:', error);
  }
}

export async function getProductById(productId: string): Promise<Product | undefined> {
  try {
    const products = await getOrInitializeProducts();
    return products.find(p => p.id === productId);
  } catch (error) {
    console.error('Error getting product:', error);
    return undefined;
  }
}

function getStatusForStock(stock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (stock === 0) return 'Out of Stock';
  if (stock < 20) return 'Low Stock';
  return 'In Stock';
}
