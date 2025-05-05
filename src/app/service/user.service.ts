import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, switchMap, tap, throwError } from 'rxjs';
import { SuapUserData } from '../models/suapUserData.interface';
import { environment } from './../../environments/environment';
import { AuthService } from './auth.service';
import { User } from '../models/user.interface';
import { Role } from '../models/enums/role.enum';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	
	/** Serviços */

	http: HttpClient = inject(HttpClient);
	router: Router = inject(Router);
	authService = inject(AuthService);

	/** Armazena os dados do usuário atual. */
	user?: User;

	/** Emite um evento quando os dados do usuário são atualizados. */
	private userUpdate = new BehaviorSubject<User | undefined>(undefined);
	userUpdate$ = this.userUpdate.asObservable();

	// Define a URL para buscar os dados do usuário no SUAP.
	myDataUrl = `${environment.SUAP_URL}/api/rh/meus-dados/`;
	fetchRoleUrl = `${environment.API_URL}/usuario/papel`;

	constructor() {
		// Busca os dados do usuário
		this.fetchUserData().subscribe({
			error: (err) => console.warn(err),
			complete: () => console.log('Tentativa de login concluída.'),
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
		localStorage.removeItem('impressaocnat:suapToken');
		localStorage.removeItem('impressaocnat:role');
		
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
			!!localStorage.getItem('impressaocnat:suapToken')
		);
	}

	/**
	 * Busca dados do usuário no SUAP e verifica permissões de administrador.
	 *
	 * @returns {Observable<boolean>} Um Observable que emite `true` se a busca e verificação forem bem-sucedidas, `false` caso contrário.
	 */
	fetchUserData(): Observable<Role> {
		// Obtém o token de autenticação do serviço AuthService.
		const token = this.authService.client.getToken();

		// Verifica se o token existe.
		if (!token) {
			return throwError(() => new Error('Nenhum usuário conectado.'));
		}

		// Faz a requisição GET para buscar os dados do usuário no SUAP.
		return this.http.get<SuapUserData>(this.myDataUrl).pipe(
			// Encadeia a requisição de permissão de administrador.
			switchMap((suapData: SuapUserData) => {
				// Obtém a matrícula do usuário dos dados recebidos.
				const userRegistration = suapData.matricula;

				// Verifica se a matrícula está definida.
				if (!userRegistration) {
					return throwError(
						() =>
							new Error(
								`Não foi possível recuperar dados do usuário.`
							)
					);
				}

				// Busca a permissão de administrador usando a matrícula do usuário.
				return this.fetchAdminPermission(userRegistration).pipe(
					// Define o usuário e sua permissão de administrador.
					tap((role: Role) => this.setUser(suapData, role))
				);
			})
		);
	}

	/**
	 * Define o usuário atual e sua permissão de administrador.
	 *
	 * @param {SuapUserData} data Os dados do usuário a serem definidos.
	 * @param {boolean} isAdminOrManager Indica se o usuário é um administrador.
	 */
	setUser(data: SuapUserData, role: Role): void {
		// Atribui dados ao usuário

		this.user = {
			commonName: data.nome_usual, // Nome usual
			registrationNumber: data.matricula, // Matrícula
			email: data.email, // E-mail
			phoneNumbers: data.vinculo.telefones_institucionais.join(", "), // Telefones
			sector: data.vinculo.setor_suap, // Setor suap
			photoUrl: data.url_foto_150x200, // url Foto
			role: role // Papel
		};

		// Armazena a permissão de administrador no localStorage.
		localStorage.setItem('impressaocnat:role', role);

		// Emite um evento 'userUpdate' com os dados do usuário atualizados.
		this.userUpdate.next(this.user);
	}

	/**
	 * Obtém os dados do usuário atual.
	 *
	 * @returns {SuapUserData | undefined} Os dados do usuário atual ou undefined se não houver usuário.
	 */
	getCurrentUser(): User | undefined {
		return this.user;
	}

	/**
	 * Busca a permissão de administrador para um usuário com base na matrícula.
	 *
	 * @param {string} registrationNumber A matrícula do usuário.
	 * @returns {Observable<boolean>} Um Observable que emite `true` se o usuário for administrador, `false` caso contrário.
	 */
	fetchAdminPermission(registrationNumber: string): Observable<Role> {
		// Cria um objeto HttpParams para adicionar o parâmetro de matrícula.
		let httpParams = new HttpParams();
		httpParams = httpParams.set('registrationNumber', registrationNumber);

		// Faz a requisição GET para buscar a permissão de administrador.
		return this.http.get<Role>(this.fetchRoleUrl, { params: httpParams });
	}

	/**
	 * Verifica se o usuário atual é um administrador.
	 *
	 * @returns {boolean} `true` se o usuário for um administrador, `false` caso contrário.
	 */
	isUserAdminOrManager(): boolean {
		// Obtém o usuário atual.
		const user: User | undefined = this.user;

		// Verifica se o usuário existe e se tem permissão de ADMIN ou MANAGER.
		if (user && user.role) return user.role === Role.ADMIN || user.role === Role.MANAGER;
		return false;
	}
}
