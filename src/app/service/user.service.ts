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
	
	/** Serviços */

	http: HttpClient = inject(HttpClient);
	router: Router = inject(Router);
	authService = inject(AuthService);

	/** Armazena os dados do usuário atual. */
	user?: UserData;

	/** Emite um evento quando os dados do usuário são atualizados. */
	userUpdate = new EventEmitter<UserData>();

	// Define a URL para buscar os dados do usuário no SUAP.
	myDataUrl = `${environment.SUAP_URL}/api/rh/meus-dados/`;
	fetchAdminUrl = `${environment.API_URL}/usuario/admin`;

	constructor() {
		// Busca os dados do usuário
		this.fetchUserData().subscribe({
			error: (err) => console.warn(err),
			complete: () => console.log('Tentativa de login concluída'),
		});
	}

	/**
     * Redireciona o usuário para a página de login do serviço de autenticação SUAP.
     */
	logUserRedirect() {
		location.href = this.authService.client.getLoginURL();
	}

    /**
     * Verifica se o token de autenticação está expirado.
     *
     * @returns {boolean} `true` se o token estiver expirado ou não existir, `false` caso contrário.
     */
	isTokenExpired(): boolean {
		// Obtém o token de autenticação.
		let token = this.authService.client.getToken();

		// Obtém o tempo atual em milissegundos.
		let currentTime = new Date().getTime();

		// Se não houver token, retorna true (token expirado ou inexistente).
		if (!token) return true;

		// Obtém o tempo de início e o tempo de expiração do token.
		let tokenStartTime = token.startTime || 0;
		let tokenExpirationTime = token.expirationTimeInSeconds || 0;

		// Verifica se o tempo atual é maior que o tempo de expiração do token.
		return currentTime > tokenStartTime + tokenExpirationTime * 1000;
	}

	/**
     * Realiza o logout do usuário, revogando o token de autenticação e limpando o armazenamento local.
     */
	logoutUser(): void {
		let token = this.authService.client.getToken();

		// Verifica se o token existe e o revoga, se necessário.
		if (token) token.revoke();
		else console.warn('Aviso: Nenhum token de login encontrado');

		// Remove o token e a permissão de administrador do armazenamento local.
		localStorage.removeItem('suapToken');
		localStorage.removeItem('suapAdmin');
		
		// Navega para a rota raiz da aplicação.
		this.router.navigate(['']);
	}

	/**
	 * Verifica se o usuário está logado, verificando a existência do token de autenticação e do token no armazenamento local.
	 *
	 * @returns {boolean} `true` se o usuário estiver logado, `false` caso contrário.
	 */
	isLoggedIn(): boolean {
		// Verifica se o token de autenticação e o token no armazenamento local existem.
		return (
			!!this.authService.client.getToken() &&
			!!localStorage.getItem('suapToken')
		);
	}

	/**
	 * Busca dados do usuário no SUAP e verifica permissões de administrador.
	 *
	 * @returns {Observable<boolean>} Um Observable que emite `true` se a busca e verificação forem bem-sucedidas, `false` caso contrário.
	 */
	fetchUserData(): Observable<boolean> {
		// Obtém o token de autenticação do serviço AuthService.
		const token = this.authService.client.getToken();

		// Verifica se o token existe.
		if (!token) {
			return throwError(() => new Error('Nenhum usuário conectado'));
		}

		// Faz a requisição GET para buscar os dados do usuário no SUAP.
		return this.http.get<UserData>(this.myDataUrl).pipe(
			// Encadeia a requisição de permissão de administrador.
			switchMap((data: UserData) => {
				// Obtém a matrícula do usuário dos dados recebidos.
				const userRegistration = data.matricula;

				// Verifica se a matrícula está definida.
				if (!userRegistration) {
					return throwError(
						() =>
							new Error(
								`Não foi possível recuperar dados do usuário`
							)
					);
				}

				// Busca a permissão de administrador usando a matrícula do usuário.
				return this.fetchAdminPermission(userRegistration).pipe(
					// Define o usuário e sua permissão de administrador.
					tap((isAdmin: boolean) => this.setUser(data, isAdmin))
				);
			})
		);
	}

	/**
	 * Define o usuário atual e sua permissão de administrador.
	 *
	 * @param {UserData} data Os dados do usuário a serem definidos.
	 * @param {boolean} isAdmin Indica se o usuário é um administrador.
	 */
	setUser(data: UserData, isAdmin: boolean): void {
		// Atribui dados ao usuário
		this.user = data;
		this.user.is_admin = isAdmin;

		// Armazena a permissão de administrador no localStorage.
		localStorage.setItem('suapAdmin', isAdmin.toString());

		// Emite um evento 'userUpdate' com os dados do usuário atualizados.
		this.userUpdate.emit(this.user);
	}

	/**
	 * Obtém os dados do usuário atual.
	 *
	 * @returns {UserData | undefined} Os dados do usuário atual ou undefined se não houver usuário.
	 */
	getCurrentUser(): UserData | undefined {
		return this.user;
	}

	/**
	 * Busca a permissão de administrador para um usuário com base na matrícula.
	 *
	 * @param {string} registration A matrícula do usuário.
	 * @returns {Observable<boolean>} Um Observable que emite `true` se o usuário for administrador, `false` caso contrário.
	 */
	fetchAdminPermission(registration: string): Observable<boolean> {
		// Cria um objeto HttpParams para adicionar o parâmetro de matrícula.
		let httpParams = new HttpParams();
		httpParams = httpParams.set('registration', registration);

		// Faz a requisição GET para buscar a permissão de administrador.
		return this.http.get<boolean>(this.fetchAdminUrl, { params: httpParams });
	}

	/**
	 * Verifica se o usuário atual é um administrador.
	 *
	 * @returns {boolean} `true` se o usuário for um administrador, `false` caso contrário.
	 */
	isUserAdmin(): boolean {
		// Obtém o usuário atual.
		const user: UserData | undefined = this.user;

		// Verifica se o usuário existe e se a propriedade 'is_admin' é verdadeira.
		return user ? !!user.is_admin : false;
	}
}
