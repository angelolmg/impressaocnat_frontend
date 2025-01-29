import { HttpClient } from '@angular/common/http';
import { AfterViewInit, EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, throwError } from 'rxjs';
import { environment } from './../../environments/environment';
import { userData } from './../models/userData.interface';
import { AuthService } from './auth.service';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	http: HttpClient = inject(HttpClient);
	router: Router = inject(Router);
	authService = inject(AuthService);
	user?: userData;

	userUpdate = new EventEmitter<userData>();
	userInit = new Subscription();

	constructor() {
		this.fetchUserData().subscribe({
			next: (data: userData) => {
				this.setUser(data);
			},
			error: (err) => {
				console.warn(err);
			},
			complete: () => console.log('Tentativa de login concluída'),
		});
	}

	logUserRedirect() {
		location.href = this.authService.client.getLoginURL();
	}

	logoutUser() {
		let token = this.authService.client.getToken();
		if (token) token.revoke();
		else console.warn('No token set');

		this.router.navigate(['']);
	}

	fetchUserData(): Observable<userData> {
		let token = this.authService.client.getToken();;

		if (!token)
			return throwError(() => new Error('Nenhum usuário conectado'));

		const url = `${environment.SUAP_URL}/api/rh/meus-dados/`;

		return this.http.get<userData>(url);
	}

	setUser(data: userData) {
		this.user = data;
		this.userUpdate.emit(this.user);
	}

	getCurrentUser(): userData | undefined {
		return this.user;
	}
}
