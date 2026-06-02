import type { Analytics, Inquiry, InquiryStatus, User, VendorProfile } from './types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000' : 'https://34.228.223.158.sslip.io');

export const tokenStore = {
  get: () => localStorage.getItem('starvnt_token'),
  set: (token: string) => localStorage.setItem('starvnt_token', token),
  clear: () => localStorage.removeItem('starvnt_token')
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed');
  }

  return payload;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  register: (body: {
    name: string;
    email: string;
    password: string;
    brandName: string;
    category: string;
    city: string;
  }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  me: () => request<{ user: User | null }>('/api/me'),
  getProfile: () => request<{ profile: VendorProfile }>('/api/vendor/profile'),
  updateProfile: (body: Omit<VendorProfile, 'id' | 'rating' | 'isVerified'>) =>
    request<{ profile: VendorProfile }>('/api/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
  getInquiries: () => request<{ inquiries: Inquiry[] }>('/api/inquiries'),
  updateInquiryStatus: (id: string, status: InquiryStatus) =>
    request<{ inquiry: Inquiry }>(`/api/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  getAnalytics: () => request<Analytics>('/api/analytics')
};

export const categoryLabels: Record<string, string> = {
  CINEMATIC_PRODUCTION: 'Cinematic Production',
  VENUE: 'Heritage Venue',
  LUXURY_GIFTING: 'Moniqui Luxury Gifting',
  FASHION_STYLING: 'FTAura Styling',
  MUSIC_ENTERTAINMENT: 'Music & Entertainment',
  CORPORATE_MICE: 'Corporate MICE'
};
