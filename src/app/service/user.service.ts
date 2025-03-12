import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, switchMap, tap, throwError } from 'rxjs';
import { UserData } from '../models/userData.interface';
import { environment } from './../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	http: HttpClient = inject(HttpClient);
	router: Router = inject(Router);
	authService = inject(AuthService);
	user?: UserData;

	userUpdate = new EventEmitter<UserData>();
	userInit = new Subscription();

	constructor() {
		this.fetchUserData().subscribe({
			error: (err) => console.warn(err),
			complete: () => console.log('Tentativa de login concluída'),
		});
	}

	logUserRedirect() {
		location.href = this.authService.client.getLoginURL();
	}

	isTokenExpired(): boolean {
		let token = this.authService.client.getToken();
		let currentTime = new Date().getTime();

		if (!token) return true;

		let tokenStartTime = token.startTime || 0;
		let tokenExpirationTime = token.expirationTimeInSeconds || 0;

		return currentTime > tokenStartTime + tokenExpirationTime * 1000;
	}

	logoutUser() {
		let token = this.authService.client.getToken();
		if (token) token.revoke();
		else console.warn('No token set');

		localStorage.removeItem('suapToken');
		localStorage.removeItem('suapAdmin');

		this.router.navigate(['']);
	}

	isLoggedIn() {
		return (
			this.authService.client.getToken() != undefined &&
			localStorage.getItem('suapToken') != null
		);
	}

	// Busca dados do usuário no SUAP, depois usa matrícula para averiguar e atualizar permissões
	fetchUserData(): Observable<boolean> {
		let token = this.authService.client.getToken();

		if (!token)
			return throwError(() => new Error('Nenhum usuário conectado'));

		const url = `${environment.SUAP_URL}/api/rh/meus-dados/`;

		return this.http.get<UserData>(url).pipe(
			switchMap((data: UserData) => {
				let userRegistration = data.matricula;

				if (!userRegistration)
					return throwError(
						() =>
							new Error(
								`Não foi possível recuperar dados do usuário`
							)
					);

				return this.fetchAdminPermission(userRegistration).pipe(
					tap((isAdmin: boolean) => this.setUser(data, isAdmin))
				);
			})
		);
	}

	setUser(data: UserData, isAdmin: boolean) {
		this.user = data;
		this.user.is_admin = isAdmin;
		localStorage.setItem('suapAdmin', isAdmin.toString());
		this.userUpdate.emit(this.user);
	}

	getCurrentUser(): UserData | undefined {
		return this.user;
	}

	fetchAdminPermission(registration: string): Observable<boolean> {
		let httpParams = new HttpParams();
		httpParams = httpParams.set('registration', registration);
		let url = `${environment.API_URL}/usuario/admin`;

		return this.http.get<boolean>(url, { params: httpParams });
	}

	isUserAdmin() {
		return this.user ? this.user.is_admin : false;
	}
}
