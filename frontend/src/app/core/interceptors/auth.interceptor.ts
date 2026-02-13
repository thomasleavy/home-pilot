import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** When the backend is unreachable (status 0) or returns 401, clear session and user is sent to welcome on next navigation/reload. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const status = err?.status ?? 0;
      const backendUnreachable = status === 0;
      const unauthorized = status === 401;
      if (auth.getToken() && (backendUnreachable || unauthorized)) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
