const API_BASE = '/api';

export const api = {
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data;
  },
  async getMenuItems() {
    const res = await fetch(`${API_BASE}/menu_items`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch menu items');
    return data;
  },
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
    return data;
  },
  async createOrder(orderData: any) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create order');
    return data;
  },
  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data;
  },
  async getPromoCodes() {
    const res = await fetch(`${API_BASE}/promo_codes`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch promo codes');
    return data;
  },
  async getQueueStatus() {
    const res = await fetch(`${API_BASE}/settings/queue`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch queue status');
    return data;
  },
  async createMenuItem(item: any) {
    const res = await fetch(`${API_BASE}/menu_items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create menu item');
    return data;
  },
  async updateMenuItem(id: string, item: any) {
    const res = await fetch(`${API_BASE}/menu_items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update menu item');
    return data;
  },
  async deleteMenuItem(id: string) {
    const res = await fetch(`${API_BASE}/menu_items/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete menu item');
    return data;
  },
  async createCategory(name: string) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data;
  },
  async createPromoCode(promo: any) {
    const res = await fetch(`${API_BASE}/promo_codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create promo code');
    return data;
  }
};
