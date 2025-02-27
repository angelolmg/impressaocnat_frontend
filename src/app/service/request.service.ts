import {
	HttpClient,
	HttpHeaders,
	HttpParams,
	HttpResponse
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { RequestInterface } from '../models/request.interface';
import { NewCopyFormData } from './../models/copy.interface';
import { UserService } from './user.service';

export interface FileDownloadResponse {
	filename: string;
	data: Blob;
  }

@Injectable({
	providedIn: 'root',
})
export class RequestService {
	userService = inject(UserService);
	http: HttpClient = inject(HttpClient);
	requestUrl = `${environment.API_URL}/solicitacoes`;
	copyUrl = `${environment.API_URL}/copias`;
	apiUrl = `${environment.API_URL}/api`;

	editRequest(
		id: number,
		files: File[],
		copies: NewCopyFormData[],
		term: number,
		totalPageCount: number
	): Observable<any> {
		if (!term || !totalPageCount) {
			return throwError(
				() =>
					new Error(
						'Dados do formulário não preenchidos. Não foi possível enviar solicitação.'
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
		copies: NewCopyFormData[],
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
						'Dados do formulário não preenchidos. Não foi possível enviar requisição.'
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

	toogleRequest(id: number): Observable<any> {
		return this.http.patch<any>(
			this.requestUrl + '/' + id + '/status',
			null
		);
	}

	getAllRequests(
		params?: Partial<{
			filtering: boolean | null;
			concluded: boolean | null;
			startDate: Date | null;
			endDate: Date | null;
			query: string | null;
		}>
	): Observable<RequestInterface[]> {
		let httpParams = new HttpParams();

		if (params?.filtering) {
			httpParams = httpParams.set(
				'filtering',
				params.filtering.toString()
			);
		}
		// Diferente pois são 3 estados possiveis de filtragem (true, false e null)
		if (params?.concluded != null) {
			httpParams = httpParams.set('concluded', params.concluded);
		}
		if (params?.startDate) {
			httpParams = httpParams.set(
				'startDate',
				params.startDate.getTime().toString()
			);
		}
		if (params?.endDate) {
			httpParams = httpParams.set(
				'endDate',
				params.endDate.getTime().toString()
			);
		}
		if (params?.query) {
			httpParams = httpParams.set('query', params.query);
		}

		return this.http.get<RequestInterface[]>(this.requestUrl, {
			params: httpParams,
		});
	}

	getCopiesByRequestId(
		requestId?: number,
		query?: string
	): Observable<NewCopyFormData[]> {
		if (!requestId) {
			console.warn("[request.service] Nenhum 'requestId' definido.");
			return of([]);
		}

		let httpParams = new HttpParams();
		if (query) httpParams = httpParams.set('query', query);

		return this.http.get<NewCopyFormData[]>(this.copyUrl + '/' + requestId, {
			params: httpParams,
		});
	}

	getRequestById(id: number): Observable<RequestInterface> {
		return this.http.get<RequestInterface>(this.requestUrl + '/' + id);
	}

	removeRequestById(id: number): Observable<any> {
		return this.http.delete<any>(this.requestUrl + '/' + id);
	}

	patchCopy(
		copyToPatch: NewCopyFormData,
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
			counter += copy.printConfig.sheetsTotal;
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
			counter += copy.printConfig.sheetsTotal;
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

	downloadFile(requestId: number, filename: string): Observable<FileDownloadResponse> {
		return this.http.get(this.requestUrl + '/' + requestId + '/' + filename, { observe: 'response', responseType: 'blob' })
		  .pipe(
			map((response: HttpResponse<Blob>) => ({
			  filename: filename,
			  data: response.body!,
			}))
		  );
	  }

	generateReport(requests: RequestInterface[]) {
		return this.http.post(this.apiUrl + '/relatorio', requests, {
			responseType: 'text',
		});
	}

	calcPagesByInterval(interval: string): number {
		if (!interval || interval.trim() === '') return 0;
		
		let totalPages = 0;
		const ranges = interval.split(',');

		for (const range of ranges) {
			const parts = range.trim().split('-');

			if (parts.length === 2) {
				// Handle range like "1-5"
				const start = parseInt(parts[0], 10);
				const end = parseInt(parts[1], 10);

				if (!isNaN(start) && !isNaN(end) && start <= end) {
					totalPages += end - start + 1;
				}
			} else if (parts.length === 1) {
				// Handle single page like "8"
				const page = parseInt(parts[0], 10);

				if (!isNaN(page)) {
					totalPages += 1;
				}
			}
		}

		return totalPages;
	};
	
}
