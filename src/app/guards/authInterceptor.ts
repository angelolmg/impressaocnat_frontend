import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './../service/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const authToken = authService.client.getToken();

	if (authToken) {
		req = req.clone({
			setHeaders: {
				Authorization: `Bearer ${authToken.getValue()}`,
			},
		});
	}
	return next(req).pipe(
		catchError((error) => {
			if (error instanceof HttpErrorResponse && error.status === 401) {
				router.navigate(['']);
			}
			return throwError(() => error);
		})
	);
};
