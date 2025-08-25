const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Rooms
  async getRooms() {
    return this.request<{ success: boolean; data: any[] }>('/rooms');
  }

  async createRoom(roomData: any) {
    return this.request<{ success: boolean; data: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(roomId: string, roomData: any) {
    return this.request<{ success: boolean; data: any }>(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(roomId: string) {
    return this.request<{ success: boolean; message: string }>(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // Tenants
  async getTenants() {
    return this.request<{ success: boolean; data: any[] }>('/tenants');
  }

  async createTenant(tenantData: any) {
    return this.request<{ success: boolean; data: any }>('/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async updateTenant(tenantId: string, tenantData: any) {
    return this.request<{ success: boolean; data: any }>(`/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async deleteTenant(tenantId: string) {
    return this.request<{ success: boolean; message: string }>(`/tenants/${tenantId}`, {
      method: 'DELETE',
    });
  }

  // Rent Payments
  async getRentPayments(params?: { status?: string; wing?: string; month?: string; search?: string }) {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null && v !== ''))
      : '';
    return this.request<{ success: boolean; data: any[] }>(`/rent-payments${qs}`);
  }

  async createRentPayment(paymentData: any) {
    return this.request<{ success: boolean; data: any }>('/rent-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async updateRentPayment(paymentId: string, paymentData: any) {
    return this.request<{ success: boolean; data: any }>(`/rent-payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async deleteRentPayment(paymentId: string) {
    return this.request<{ success: boolean; message: string }>(`/rent-payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  async getRentPaymentStats(month?: string) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<{ success: boolean; data: any }>(`/rent-payments/stats${qs}`);
  }

  async generateMonthlyRent(month: string) {
    return this.request<{ success: boolean; data: any }>(`/rent-payments/generate`, {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  }

  // Expenses
  async getExpenses() {
    return this.request<{ success: boolean; data: any[] }>('/expenses');
  }

  async createExpense(expenseData: any) {
    return this.request<{ success: boolean; data: any }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(expenseId: string, expenseData: any) {
    return this.request<{ success: boolean; data: any }>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(expenseId: string) {
    return this.request<{ success: boolean; message: string }>(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getSettings() {
    return this.request<{ success: boolean; data: any }>('/settings');
  }

  // Contacts
  async getContacts() {
    return this.request<{ success: boolean; data: any[] }>(`/contacts`);
  }

  async createContact(contactData: any) {
    return this.request<{ success: boolean; data: any }>(`/contacts`, {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async markContactRead(id: string) {
    return this.request<{ success: boolean; data: any }>(`/contacts/${id}/read`, {
      method: 'PUT',
    });
  }

  async updateSettings(settingsData: any) {
    return this.request<{ success: boolean; data: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Initialize database
  async initializeDatabase() {
    return this.request<{ success: boolean; message: string }>('/init-database', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(); 