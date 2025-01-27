import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { RequestInterface } from '../models/request.interface';
import { CopyInterface } from './../models/copy.interface';
import { UserService } from './user.service';

@Injectable({
	providedIn: 'root',
})
export class RequestService {
	userService = inject(UserService);
	http: HttpClient = inject(HttpClient);
	requestUrl = `${environment.API_URL}/solicitacoes`;
	copyUrl = `${environment.API_URL}/copias`;

	editRequest(
		id: number,
		files: File[],
		copies: CopyInterface[],
		term: number,
		totalPageCount: number
	): Observable<any> {

		if (!term || !totalPageCount) {
			return throwError(
				() =>
					new Error(
						'Falha nos dados do formulário. Não foi possível enviar solicitação.'
					)
			);
		}

		let currentUser = this.userService.getCurrentUser();
		if (!currentUser) {
			return throwError(
				() =>
					new Error(
						'Nenhum usuário encontrado. Não foi possível enviar solicitação.'
					)
			);
		}

		console.log('Enviando edição de solicitação...');

		let request = {
			id: id,
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

		return this.http.patch(this.requestUrl + '/' + id, formData, {
			headers,
		});
	}

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

		return this.http.post(this.requestUrl, formData, { headers });
	}

	getAllRequests(): Observable<RequestInterface[]> {
		return this.http.get<RequestInterface[]>(this.requestUrl);
	}

	getRequestById(id: number): Observable<RequestInterface> {
		return this.http.get<RequestInterface>(this.requestUrl + '/' + id);
	}

	deleteRequestById(id: number): Observable<any> {
		return this.http.delete<any>(this.requestUrl + '/' + id);
	}

	patchCopy(
		copyToPatch: CopyInterface,
		request: RequestInterface
	): Observable<any> {
		// Verifica se há cópias na requisição
		if (!request.copies?.length) return EMPTY;

		// Busca o índice da cópia a ser atualizada
		const copyIndex = request.copies.findIndex(
			(copy) => copy.id === copyToPatch.id
		);

		// Verifica se a cópia foi encontrada
		if (copyIndex === -1) return EMPTY;

		// Atualiza a cópia dentro da requisição
		request.copies[copyIndex] = copyToPatch;

		// Refresh total page counter of the request
		var counter = 0;
		request.copies.forEach((copy) => {
			counter += copy.pageCount * copy.copyCount;
		});

		// Retorna a requisição de edição
		return this.editRequest(
			request.id,
			[],
			request.copies,
			request.term / (60 * 60),
			counter
		);
	}

	removeCopyById(
		copyIdForRemoval: number,
		request: RequestInterface
	): Observable<any> {
		// Verifica se há cópias na requisição
		if (!request.copies?.length) return EMPTY;

		// Verifica se a cópia a ser removida existe
		const copyIndex = request.copies.findIndex(
			(copy) => copy.id === copyIdForRemoval
		);
		if (copyIndex === -1) return EMPTY;

		// Remove a cópia pelo índice
		request.copies.splice(copyIndex, 1);

		// Refresh total page counter of the request
		var counter = 0;
		request.copies.forEach((copy) => {
			counter += copy.pageCount * copy.copyCount;
		});

		// Retorna a requisição de edição
		return this.editRequest(
			request.id,
			[],
			request.copies,
			request.term / (60 * 60),
			counter
		);
	}
}
