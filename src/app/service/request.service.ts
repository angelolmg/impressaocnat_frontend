import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CopyInterface } from '../models/copy.interface';
import { UserService } from './user.service';
import { RequestInterface } from '../models/request.interface';

@Injectable({
	providedIn: 'root',
})
export class RequestService {
	userService = inject(UserService);
	http: HttpClient = inject(HttpClient);
	url = `${environment.API_URL}/solicitacoes`;

	constructor() {}

	saveRequest(
		files: File[],
		copies: CopyInterface[],
		term: number,
		totalPageCount: number
	): Observable<any> {
		if (
			files.length <= 0 ||
			files.length != copies.length ||
			!term ||
			!totalPageCount
		) {
			return throwError(
				() =>
					new Error(
						'Falha nos dados do formulário. Não foi possível enviar requisição.'
					)
			);
		}

		let currentUser = this.userService.getCurrentUser();
		if (!currentUser) {
			return throwError(
				() =>
					new Error(
						'Nenhum usuário encontrado. Não foi possível enviar requisição.'
					)
			);
		}

		console.log('Enviando requisição...');

		let request = {
			term: term * 60 * 60,
			totalPageCount: totalPageCount,
			username: currentUser.nome_usual,
			registration: currentUser.matricula,
			copies: copies,
		};

		const formData = new FormData();

		formData.append(
			'solicitacao',
			new Blob([JSON.stringify(request)], {
				type: 'application/json',
			})
		);

		files.forEach((file) => {
			formData.append('arquivos', file);
		});

		let headers = new HttpHeaders();
		headers.append('Accept', 'application/json');
		headers.append('Content-Type', 'multipart/form-data');

		return this.http.post(this.url, formData, { headers });
	}

	getAllRequests(): Observable<RequestInterface[]> {
		return this.http.get<RequestInterface[]>(this.url);
	}

	getRequestById(id: number): Observable<RequestInterface> {
		return this.http.get<RequestInterface>(this.url + '/' + id);
	}

	deleteRequestById(id: number): Observable<any> {
		return this.http.delete<any>(this.url + '/' + id);
	}
}
