import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUserSubject.next(user);
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { username, password });
  }

  register(username: string, password: string, role: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password, role });
  }

  setCurrentUser(user: any) {
    localStorage.setItem('token', user.token);
    localStorage.setItem('refreshToken', user.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/refresh`, { refreshToken });
  }

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('Logged out from server'),
        error: (err) => console.log('Logout error:', err)
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('editResponse');
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === 'admin';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}