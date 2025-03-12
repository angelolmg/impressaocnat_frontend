import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from './../../environments/environment';
import { UserData } from './../models/userData.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	router: Router = inject(Router);
	client!: SuapClient;

	userUpdate = new EventEmitter<UserData>();

	constructor() {
		this.client = new SuapClient(
			environment.SUAP_URL,
			environment.CLIENT_ID,
			environment.REDIRECT_URI,
			environment.SCOPE
		);

		let token = localStorage.getItem('suapToken');
		if (token) this.client.initializeToken('localStorage');
	}
}

/**
 * Classe principal do SDK e seu construtor, que inicializa os principais atributos.
 *
 * @constructor
 *
 * @param {string} authHost - URI do host de autenticação.
 * @param {string} clientID - ID da aplicação registrado no SuapClient.
 * @param {string} redirectURI - URI de redirecionamento da aplicação cadastrada no SuapClient.
 *
 */
class SuapClient {
	authHost: string;
	clientID: string;
	redirectURI: string;
	scope: string;

	token!: Token;

	authorizationURL: string;
	resourceURL: string;
	logoutURL: string;
	responseType: string;
	grantType: string;

	public constructor(
		authHost: string,
		clientID: string,
		redirectURI: string,
		scope: string
	) {
		// Remove a '/' caso ela já esteja inserida no auth_host.
		if (authHost.charAt(authHost.length - 1) == '/') {
			authHost = authHost.substr(0, authHost.length - 1);
		}

		this.authHost = authHost;
		this.clientID = clientID;
		this.redirectURI = redirectURI;
		this.scope = scope;

		/* Atributos privados */

		this.resourceURL = this.authHost + '/api/eu/';
		this.authorizationURL = this.authHost + '/o/authorize/';
		this.logoutURL = this.authHost + '/o/revoke_token/';

		this.responseType = 'token';
		this.grantType = 'implict'; // Necessário para utilizar Oauth2 com Javascript
	}

	/* Métodos privados */

	/**
	 * Extrai o token da URL e retorna-o.
	 *
	 * @return {string} O token de autorização presente na URL de retorno.
	 */
	private extractToken(): string | null {
		var match = document.location.hash.match(/access_token=(\w+)/);
		if (match != null) {
			return !!match && match[1];
		}
		return null;
	}

	/**
	 * Extrai os escopos autorizados da URL e retorna-os caso o usuário já esteja autenticado.
	 * @return {string} Escopos autorizados pelo usuário (separados por espaço).
	 */
	private extractScope(): string | null {
		var match = document.location.hash.match(/scope=(.*)/);
		if (match != null) {
			return match[1].split('+').join(' ');
		}
		return null;
	}

	/**
	 * Extrai o tempo de duração do token (em segundos) da URL.
	 * @return {number} Tempo de duração do token.
	 */
	private extractDuration(): number {
		var match = document.location.hash.match(/expires_in=(\d+)/);

		if (match != null) {
			return Number(!!match && match[1]);
		}

		return 0;
	}

	/* Métodos públicos */

	/**
	 * Inicializa o objeto token.
	 * @param source Define a origem das informações: 'uri' para extrair da URI ou 'localStorage' para usar o armazenamento local.
	 */
	public initializeToken(source: string): boolean {
		let tokenValue: string | null = null;
		let tokenStartTimeMs: number | null = null;
		let tokenDurationSecs: number | null = null;
		let scope: string | null = null;

		if (source === 'uri') {
			tokenValue = this.extractToken();
			tokenStartTimeMs = new Date().getTime();
			tokenDurationSecs = this.extractDuration();
			scope = this.extractScope();
		} else if (source === 'localStorage') {
			tokenValue = localStorage.getItem('suapToken');
			tokenStartTimeMs =
				+localStorage.getItem('suapTokenStartTime')! || 0;
			tokenDurationSecs =
				+localStorage.getItem('suapTokenExpirationTime')! || 0;
			scope = localStorage.getItem('suapScope');
		}

		if (tokenValue && tokenStartTimeMs && tokenDurationSecs && scope) {
			this.token = new Token(
				tokenValue,
				tokenStartTimeMs,
				tokenDurationSecs,
				scope
			);
			return true;
		}
		console.warn('Erro ao inicializar token do cliente SUAP');
		return false;
	}

	/**
	 * Retorna o objeto token.
	 *
	 * @return {string} token se o usuário estiver autenticado; null caso contrário.
	 */
	public getToken(): Token {
		return this.token;
	}

	/**
	 * Retorna a URI de redirecionamento.
	 *
	 * @return {string} URI de redirecionamento.
	 */
	public getRedirectURI() {
		return this.redirectURI;
	}

	/**
	 * Retorna se o usuário está autenticado ou não com base no estado do token.
	 * @return {Boolean} true se o usuário estiver autenticado; false caso contrário.
	 */
	public isAuthenticated() {
		return this.token.isValid();
	}

	/**
	 * Cria a URL de login com todos os parâmetros da aplicação.
	 * @return {string} A URL de login do SuapClient.
	 */
	public getLoginURL(): string {
		var loginUrl =
			this.authorizationURL +
			'?response_type=' +
			this.responseType +
			'&grant_type=' +
			this.grantType +
			'&client_id=' +
			this.clientID +
			'&scope=' +
			this.scope;
		return loginUrl;
	}

	/**
	 * Cria a URL de cadastro com retorno.
	 * @return {string} A URL de cadastro do SuapClient.
	 */
	public getRegistrationURL(): string {
		var registrationUrl =
			this.authHost + '/register/' + '?redirect_uri=' + this.redirectURI;
		return registrationUrl;
	}
}

/**
 * Classe que representa um token de autorização.
 *
 * @constructor
 *
 * @param {string} value - A sequência de caracteres que representa o Token.
 * @param {number} tokenStartTimeMs - Data de inicialização do token em milissegundos.
 * @param {number} expirationTimeInSeconds - Número de segundos que o token durará.
 * @param {string} scope - A lista de escopos (separados por espaço) que foi autorizado pelo usuário.
 */
class Token {
	value?: string;
	startTime?: number;
	expirationTimeInSeconds?: number;
	scope?: string;

	public constructor(
		value: string,
		startTime: number,
		expirationTimeInSeconds: number,
		scope: string
	) {
		this.value = value;
		this.startTime = startTime;
		this.expirationTimeInSeconds = expirationTimeInSeconds;
		this.scope = scope;

		localStorage.setItem('suapToken', value);
		localStorage.setItem('suapTokenStartTime', this.startTime.toString());
		localStorage.setItem(
			'suapTokenExpirationTime',
			this.expirationTimeInSeconds.toString()
		);
		localStorage.setItem('suapScope', scope);
	}

	public getValue() {
		return this.value;
	}

	public getExpirationTime() {
		return this.expirationTimeInSeconds;
	}

	public getScope() {
		return this.scope;
	}

	public isValid() {
		return (
			localStorage.getItem('suapToken') &&
			this.getValue() &&
			!this.hasExpired()
		);
	}

	public hasExpired() {
		let actualTime = new Date().getTime();
		return (
			this.startTime! + this.expirationTimeInSeconds! * 1000 > actualTime
		);
	}

	public revoke() {
		this.value = undefined;
		this.startTime = undefined;
		this.expirationTimeInSeconds = undefined;
		this.scope = undefined;

		localStorage.removeItem('suapToken');
		localStorage.removeItem('suapTokenStartTime');
		localStorage.removeItem('suapTokenExpirationTime');
		localStorage.removeItem('suapScope');
	}
}
