import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // httpOnly 쿠키 전송
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API 타입 정의
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  username: string;
  email: string;
  message?: string;
}

export interface TransactionRequest {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  paymentMethodId: number; // 변경: paymentMethod string → paymentMethodId number
  currency: string;
  originalAmount?: number;
  discountRate?: number;
  exchangeRate?: number;
  tags?: string;
  transactionDate: string; // ISO 형식
}

export interface TransactionUpdateRequest {
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  description?: string;
  paymentMethodId?: number;
  currency?: string;
  originalAmount?: number;
  discountRate?: number;
  exchangeRate?: number;
  tags?: string;
  transactionDate?: string;
}

export interface TransactionResponse {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  paymentMethodId: number; // 결제수단 ID
  paymentMethod: string; // 결제수단명 (서버에서 매핑된 값)
  currency: string;
  originalAmount?: number;
  discountRate?: number;
  exchangeRate?: number;
  tags?: string;
  transactionDate: string; // YYYY-MM-DD 형식
  createdAt: string; // ISO 8601 UTC 형식 (예: "2024-01-03T10:30:00Z")
}

export interface PaymentMethodResponse {
  id: number;
  name: string;
  sortOrder: number;
}

export interface PaymentMethodRequest {
  name: string;
}

// Auth API
export const authAPI = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get<AuthResponse>('/auth/me'),
};

// Transaction API
export const transactionAPI = {
  create: (data: TransactionRequest) =>
    api.post<TransactionResponse>('/transactions', data),

  getList: (page: number = 0, size: number = 20) =>
    api.get<{ content: TransactionResponse[]; totalPages: number; totalElements: number }>('/transactions', {
      params: { page, size }
    }),

  getById: (id: number) =>
    api.get<TransactionResponse>(`/transactions/${id}`),

  update: (id: number, data: TransactionUpdateRequest) =>
    api.patch<TransactionResponse>(`/transactions/${id}`, data),

  delete: (id: number) =>
    api.delete(`/transactions/${id}`),

  getMonthly: (year: number, month: number) =>
    api.get<TransactionResponse[]>(`/transactions/monthly/${year}/${month}`),
};

// Payment Method API
export const paymentMethodAPI = {
  getList: () =>
    api.get<PaymentMethodResponse[]>('/payment-methods'),

  create: (data: PaymentMethodRequest) =>
    api.post<PaymentMethodResponse>('/payment-methods', data),

  update: (id: number, data: PaymentMethodRequest) =>
    api.put<PaymentMethodResponse>(`/payment-methods/${id}`, data),

  delete: (id: number) =>
    api.delete(`/payment-methods/${id}`),
};
