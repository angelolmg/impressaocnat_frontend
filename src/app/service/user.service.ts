import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { environment } from './../../environments/environment';
import { userData } from './../models/userData.interface';

@Injectable({
	providedIn: 'root',
})
export class UserService {
  http: HttpClient = inject(HttpClient);
	client!: SuapClient;
  user?: userData;

  userUpdate = new EventEmitter<userData>();

	constructor() {
		this.client = new SuapClient(
			environment.SUAP_URL,
			environment.CLIENT_ID,
			environment.REDIRECT_URI,
			environment.SCOPE
		);
	}

	logUser() {
		location.href = this.client.getLoginURL();
	}

  getUserData(): Observable<userData> {
    const token = this.client.getToken().getValue();

    if(!token) {
      console.warn('No token set');
      return EMPTY;
    }

    const url = `${environment.SUAP_URL}/api/rh/meus-dados/`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
      'Accept': '*/*'
    });

    return this.http.get<userData>(url, { headers });
  }

  setUser(data: userData) {
    this.user = data;
    this.userUpdate.emit(this.user);
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

	dataJSON = {};
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
	 * Inicializa os objetos token e o dataJSON.
	 *
	 */
	public extractInfoFromURI(): boolean {
		const tokenValue = this.extractToken();
		const extractDuration = this.extractDuration();
		const extractScope = this.extractScope();

		if (tokenValue && extractDuration && extractScope) {
			this.token = new Token(tokenValue, extractDuration, extractScope);
			this.dataJSON = {};
			return true;
		}

		console.warn('Inicialização do cliente SUAP falhou');
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
	 * Retorna o objeto dataJSON, que contém os dados retornados após a requisição Ajax.
	 *
	 * @return {Object} O objeto JSON com os dados requisitados.
	 */
	public getDataJSON(): {} {
		return this.dataJSON;
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
		'&redirect_uri=' + this.redirectURI;
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
 * @param {number} expirationTime - Número de segundos que o token durará.
 * @param {string} scope - A lista de escopos (separados por espaço) que foi autorizado pelo usuário.
 */
class Token {
	value?: string;
	startTime?: number;
	endTime?: Date;
	scope?: string;

	public constructor(
		value: string,
		expirationTimeInSeconds: number,
		scope: string
	) {
		this.value = value;
		this.startTime = new Date().getTime(); // O valor em milissegundos.
		this.endTime = new Date(
			this.startTime + expirationTimeInSeconds * 1000
		);
		this.scope = scope;

		localStorage.setItem('suapToken', value);
		localStorage.setItem(
			'suapTokenExpirationTime',
			this.endTime.toDateString()
		);
		localStorage.setItem('suapScope', scope);
	}

	public getValue() {
		return this.value;
	}

	public getExpirationTime() {
		return this.endTime;
	}

	public getScope() {
		return this.scope;
	}

	public isValid() {
		return localStorage.getItem('suapToken') && this.value != null;
	}

	public revoke() {
		this.value = undefined;
		this.startTime = undefined;
		this.endTime = undefined;

		if (localStorage.getItem('suapToken')) {
			localStorage.removeItem('suapToken');
		}

		if (localStorage.getItem('suapTokenExpirationTime')) {
			localStorage.removeItem('suapTokenExpirationTime');
		}

		if (localStorage.getItem('suapScope')) {
			localStorage.removeItem('suapScope');
		}
	}
}
