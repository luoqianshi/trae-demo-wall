import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = environment.tokenKey;
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const cached = this.readUser();
    if (cached) this.userSubject.next(cached);
  }

  login(phone: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { phone, password };
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, body).pipe(
      tap((res) => this.persist(res)),
      catchError((err) => throwError(() => err))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, payload).pipe(
      tap((res) => this.persist(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/refresh`, {}).pipe(
      tap((res) => this.persist(res))
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('sec_user');
    this.userSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  sendCode(phone: string, _purpose?: 'login' | 'change-phone'): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/send-code`, { phone });
  }

  changePhone(oldPhone: string, newPhone: string, code: string): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/users/me/phone`, { oldPhone, newPhone, code }).pipe(
      tap(() => {
        const cached = this.readUser();
        if (cached) {
          cached.phone = newPhone;
          localStorage.setItem('sec_user', JSON.stringify(cached));
          this.userSubject.next(cached);
        }
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/users/me/password`, {
      oldPassword,
      newPassword,
    });
  }

  logout(): void {
    this.clearToken();
  }

  private persist(res: AuthResponse): void {
    if (res.token) {
      localStorage.setItem(this.TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem('sec_user', JSON.stringify(res.user));
      this.userSubject.next(res.user);
    }
  }

  private readUser(): User | null {
    const raw = localStorage.getItem('sec_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
