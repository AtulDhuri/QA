import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for login, register, and refresh endpoints
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
      return next.handle(req);
    }

    const token = localStorage.getItem('token');
    
    // Check if token is expired before making request
    if (token && this.isTokenExpired(token)) {
      return this.handle401Error(req, next);
    }

    // Always add token to protected requests
    if (token) {
      req = this.addToken(req, token);
    } else {
      // No token available, redirect to login
      this.authService.logout();
      return throwError(() => new Error('No token available'));
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    console.log('Adding token to request:', request.url);
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.token);
            localStorage.setItem('token', response.token);
            return next.handle(this.addToken(request, response.token));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => error);
          })
        );
      } else {
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => new Error('No refresh token available'));
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addToken(request, token)))
    );
  }
}