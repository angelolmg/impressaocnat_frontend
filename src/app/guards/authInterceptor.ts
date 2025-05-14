import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandlerFn,
	HttpInterceptorFn,
	HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Interceptor HTTP para adicionar o token de autenticação aos headers das requisições e tratar erros de autenticação.
 *
 * Este interceptor verifica se um token de autenticação está disponível no serviço de autenticação.
 * Se estiver, ele adiciona o token ao header 'Authorization' das requisições HTTP.
 * Ele também intercepta erros de resposta HTTP e redireciona o usuário para a página de login.
 *
 * @param {HttpRequest<any>} req A requisição HTTP a ser interceptada.
 * @param {HttpHandlerFn} next A função para passar a requisição para o próximo interceptor ou para o backend.
 * @returns {Observable<HttpEvent<any>>} Um Observable contendo a resposta HTTP.
 */
export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<any>,
	next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
	// Injeta os serviços necessários.
	const authService = inject(AuthService);
	const router = inject(Router);
	const snackBar = inject(MatSnackBar); // Injete o MatSnackBar

	// Obtém o token de autenticação do serviço de autenticação.
	const authToken = authService.client.getToken();

	// Se um token de autenticação estiver disponível, clona a requisição e adiciona o header 'Authorization'.
	if (authToken) {
		req = req.clone({
			setHeaders: {
				Authorization: `Bearer ${authToken.getValue()}`,
			},
		});
	}

	// Passa a requisição para o próximo interceptor ou para o backend e trata erros.
	return next(req).pipe(
		catchError((error) => {
			if (error instanceof HttpErrorResponse) {
				snackBar.open(error.error, 'Ok');
				switch (error.status) {
					// Requisição inválida
					case 400:
						break;

					// Não autorizado
					case 401:
						localStorage.removeItem('impressaocnat:suapToken');
						router.navigate(['/nova-solicitacao']);
						break;

					// Proibido
					case 403:
						router.navigate(['/nova-solicitacao']);
						break;

					// Não encontrado
					case 404:
						break;

					// Conflito
					case 410:
						break;

					// Erro interno do servidor
					case 500:
						break;

					default:
						snackBar.open(
							'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
							'Fechar'
						);
						localStorage.removeItem('impressaocnat:suapToken');
						router.navigate(['']);
						break;
				}
			}
			return throwError(() => error);
		})
	);
};
