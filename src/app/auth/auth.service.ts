import axios from 'axios';
import { User } from './models/user.model';

export class AuthService {
  private static instance: AuthService;
  private apiUrl: string = `${process.env.NEXT_PUBLIC_API_URL}`;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/login`, { email, password });
      const token = response.data.token;
      const user = response.data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'فشل تسجيل الدخول';
      throw new Error(errorMessage);
    }
  }

  async register(user: User): Promise<User> {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/register`, user);
      const token = response.data.token;
      const userData = response.data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'فشل إنشاء الحساب';
      throw new Error(errorMessage);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axios.get(`${this.apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      return null;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/auth/password-reset-request`, { email });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'فشل طلب إعادة تعيين كلمة المرور';
      throw new Error(errorMessage);
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/auth/password-reset-confirm`, { token, newPassword });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'فشل إعادة تعيين كلمة المرور';
      throw new Error(errorMessage);
    }
  }
}
