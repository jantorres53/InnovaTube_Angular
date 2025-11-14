import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl + '/api';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  async login(data: { login: string; password: string; recaptchaToken: string }): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
        login: data.login,
        password: data.password,
        recaptchaToken: data.recaptchaToken,
      })
    );
    const token = (res as any)?.data?.token ?? res.token;
    const user = (res as any)?.data?.user ?? res.user;
    if (res.success && token && user) {
      this.setAuthData(token, user);
    }
    return res;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
    recaptchaToken: string;
  }): Promise<AuthResponse> {
    const payload: Record<string, any> = {
      firstName: data.firstName,
      lastName: data.lastName,
      first_name: data.firstName,
      last_name: data.lastName,
      name: `${data.firstName} ${data.lastName}`.trim(),
      username: data.username,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword ?? data.password,
      passwordConfirm: data.confirmPassword ?? data.password,
      password_confirmation: data.confirmPassword ?? data.password,
      recaptchaToken: data.recaptchaToken,
      recaptcha: data.recaptchaToken,
      'g-recaptcha-response': data.recaptchaToken,
    };
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload)
    );
    const token = (res as any)?.data?.token ?? res.token;
    const user = (res as any)?.data?.user ?? res.user;
    if (res.success && token && user) {
      this.setAuthData(token, user);
    }
    return res;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await firstValueFrom(this.http.post(`${this.baseUrl}/auth/logout`, {}));
      } catch {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  async requestPasswordReset(email: string, recaptchaToken: string): Promise<{ success: boolean; message?: string }> {
    return await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(`${this.baseUrl}/auth/request-password-reset`, { email, recaptchaToken })
    );
  }

  async verifyResetCode(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    return await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(`${this.baseUrl}/auth/verify-reset-code`, { email, code })
    );
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(`${this.baseUrl}/auth/reset-password`, { email, code, newPassword })
    );
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setAuthData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}