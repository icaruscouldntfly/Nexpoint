const API_BASE = '/api';

export async function getOrInitializeCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function addCategory(categoryName: string): Promise<void> {
  // This would require a POST endpoint in the future if dynamic category creation is needed
  console.log('Adding category:', categoryName);
}

export async function removeCategory(categoryName: string): Promise<void> {
  // This would require a DELETE endpoint in the future if dynamic category deletion is needed
  console.log('Removing category:', categoryName);
}
