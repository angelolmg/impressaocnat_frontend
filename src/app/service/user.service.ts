import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, switchMap, tap, throwError } from 'rxjs';
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
			error: (err) => console.warn(err),
			complete: () => console.log('Tentativa de login concluída'),
		});
	}

	logUserRedirect() {
		location.href = this.authService.client.getLoginURL();
	}

	logoutUser() {
		let token = this.authService.client.getToken();
		if (token) {
			token.revoke();
			localStorage.removeItem('suapAdmin');
		} else console.warn('No token set');

		this.router.navigate(['']);
	}

	// Busca dados do usuário no SUAP, depois usa matrícula para averiguar e atualizar permissões
	fetchUserData(): Observable<boolean> {
		let token = this.authService.client.getToken();

		if (!token)
			return throwError(() => new Error('Nenhum usuário conectado'));

		const url = `${environment.SUAP_URL}/api/rh/meus-dados/`;

		return this.http
			.get<userData>(url)
			.pipe(
				switchMap((data: userData) =>
					this.fetchAdminPermission(data.matricula).pipe(
						tap((isAdmin: boolean) => this.setUser(data, isAdmin))
					)
				)
			);
	}

	setUser(data: userData, isAdmin: boolean) {
		this.user = data;
		this.user.is_admin = isAdmin;
		localStorage.setItem('suapAdmin', isAdmin.toString());
		this.userUpdate.emit(this.user);
	}

	getCurrentUser(): userData | undefined {
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
