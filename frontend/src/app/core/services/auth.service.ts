import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeviceApiService } from './device-api.service';

const TOKEN_KEY = 'mqtt-device-pilot.token';
const USER_KEY = 'mqtt-device-pilot.user';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private deviceApi = inject(DeviceApiService);
  private baseUrl = environment.apiUrl;

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getUsername(): string {
    const user = this.getCurrentUser();
    return user?.username ?? '';
  }

  register(username: string, email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/api/auth/register`, { username, email, password })
      .pipe(tap((res) => {
        this.saveSession(res.token, res.user);
        this.deviceApi.connectWebSocket();
      }));
  }

  login(login: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/api/auth/login`, { login, password })
      .pipe(tap((res) => {
        this.saveSession(res.token, res.user);
        this.deviceApi.connectWebSocket();
      }));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('mqtt-device-pilot.deviceStateOverlay');
    this.deviceApi.disconnectWebSocket();
    this.router.navigate(['/welcome']);
  }

  /** Fetch current profile from server (id, username, email). */
  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/api/auth/me`);
  }

  /** Update username and/or email. Returns new token and user; session is updated. */
  updateProfile(updates: { username?: string; email?: string }): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${this.baseUrl}/api/auth/profile`, updates).pipe(
      tap((res) => this.saveSession(res.token, res.user))
    );
  }

  /** Change password. Requires current password. */
  changePassword(currentPassword: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/api/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/auth/account`);
  }

  private saveSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem('mqtt-device-pilot.deviceStateOverlay'); // backend is source of truth per user
  }
}
