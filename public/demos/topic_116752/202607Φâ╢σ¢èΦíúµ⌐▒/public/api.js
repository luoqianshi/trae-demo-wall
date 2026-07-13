const API_BASE = '/api';

export async function fetchItems(filter = {}) {
  const params = new URLSearchParams(filter);
  const response = await fetch(`${API_BASE}/items?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  return response.json();
}

export async function fetchItem(id) {
  const response = await fetch(`${API_BASE}/items/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch item');
  }
  return response.json();
}

export async function createItem(item) {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!response.ok) {
    throw new Error('Failed to create item');
  }
  return response.json();
}

export async function updateItem(id, item) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!response.ok) {
    throw new Error('Failed to update item');
  }
  return response.json();
}

export async function deleteItem(id) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete item');
  }
  return response.json();
}

export async function fetchItemCount() {
  const response = await fetch(`${API_BASE}/items/count`);
  if (!response.ok) {
    throw new Error('Failed to fetch item count');
  }
  return response.json();
}
