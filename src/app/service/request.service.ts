import {
	HttpClient,
	HttpHeaders,
	HttpParams,
	HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { FileDownloadResponse } from '../models/dialogData.interface';
import { RequestInterface } from '../models/request.interface';
import { CopyInterface } from './../models/copy.interface';
import { UserService } from './user.service';
import { UserData } from '../models/userData.interface';

@Injectable({
	providedIn: 'root',
})
export class RequestService {
	// Serviços
	userService = inject(UserService);
	http: HttpClient = inject(HttpClient);

	// Endpoints
	apiUrl = `${environment.API_URL}`;
	requestUrl = `${this.apiUrl}/solicitacoes`;
	copyUrl = `${this.apiUrl}/copias`;
	reportUrl = `${this.apiUrl}/relatorio`;

	/**
	 * Edita uma solicitação existente.
	 *
	 * @param {number} id O ID da solicitação a ser editada.
	 * @param {File[]} files A lista de arquivos anexados à solicitação.
	 * @param {CopyInterface[]} copies A lista de cópias da solicitação.
	 * @param {number} term O prazo da solicitação em horas.
	 * @param {number} totalPageCount O número total de páginas da solicitação.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição.
	 */
	editRequest(
		id: number,
		files: File[],
		copies: CopyInterface[],
		term: number,
		totalPageCount: number
	): Observable<any> {
		// Verifica se há prazo anexado e número total de páginas
		if (term <= 0 || totalPageCount <= 0) {
			return throwError(
				() =>
					new Error(
						'Dados do formulário não preenchidos. Não foi possível enviar solicitação.'
					)
			);
		}

		// Obtém o usuário atual
		let currentUser: UserData;
		try {
			currentUser = this.getCurrentUser();
		} catch (error) {
			return throwError(() => error);
		}

		// Cria o objeto de solicitação com os dados fornecidos.
		let request: Partial<RequestInterface> = {
			id: id, // ID da solicitação a ser editada.
			term: term * 60 * 60, // Converte o prazo de horas para segundos.
			totalPageCount: totalPageCount,
			username: currentUser.nome_usual,
			registration: currentUser.matricula,
			copies: copies,
		};

		// Cria objetos FormData e HttpHeaders para enviar uma solicitação com arquivos.
		const { formData, headers } = this.buildRequest(request, files);

		return this.http.patch(this.requestUrl + '/' + id, formData, {
			headers,
		});
	}

	/**
	 * Salva uma nova solicitação.
	 *
	 * @param {File[]} files A lista de arquivos anexados à solicitação.
	 * @param {CopyInterface[]} copies A lista de cópias da solicitação.
	 * @param {number} term O prazo da solicitação em horas.
	 * @param {number} totalPageCount O número total de páginas da solicitação.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição.
	 */
	saveRequest(
		files: File[],
		copies: CopyInterface[],
		term: number,
		totalPageCount: number
	): Observable<any> {
		// Verifica se os dados do formulário estão completos e consistentes.
		if (
			files.length <= 0 ||
			files.length !== copies.length ||
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

		// Obtém o usuário atual
		let currentUser: UserData;
		try {
			currentUser = this.getCurrentUser();
		} catch (error) {
			return throwError(() => error);
		}

		// Cria o objeto de solicitação com os dados fornecidos.
		let request: Partial<RequestInterface> = {
			term: term * 60 * 60, // Converte o prazo de horas para segundos.
			totalPageCount: totalPageCount,
			username: currentUser.nome_usual,
			registration: currentUser.matricula,
			copies: copies,
		};

		// Cria objetos FormData e HttpHeaders para enviar uma solicitação com arquivos.
		const { formData, headers } = this.buildRequest(request, files);

		return this.http.post(this.requestUrl, formData, { headers });
	}

	/**
	 * Altera o status de uma solicitação (abrir/fechar).
	 *
	 * @param {number} id O ID da solicitação cujo status será alterado.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição.
	 */
	toggleRequestStatus(id: number): Observable<any> {
		return this.http.patch<any>(
			this.requestUrl + '/' + id + '/status',
			null
		);
	}

	/**
	 * Obtém todas as solicitações com filtros opcionais.
	 *
	 * @param {Partial<{ filtering: boolean | null; concluded: boolean | null; startDate: Date | null; endDate: Date | null; query: string | null; }>} [params] Os parâmetros de filtro opcionais.
	 * @returns {Observable<RequestInterface[]>} Um Observable que emite um array de solicitações.
	 */
	getAllRequests(
		params: Partial<{
			filtering: boolean | null;
			concluded: boolean | null;
			startDate: Date | null;
			endDate: Date | null;
			query: string | null;
		}>
	): Observable<RequestInterface[]> {
		// Cria um objeto HttpParams para adicionar os parâmetros de filtro.
		let httpParams = new HttpParams();

		// Adiciona o parâmetro 'filtering' se fornecido.
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

		// Adiciona o parâmetro 'startDate' se fornecido.
		if (params?.startDate) {
			httpParams = httpParams.set(
				'startDate',
				params.startDate.getTime().toString()
			);
		}

		// Adiciona o parâmetro 'endDate' se fornecido.
		if (params?.endDate) {
			httpParams = httpParams.set(
				'endDate',
				params.endDate.getTime().toString()
			);
		}

		// Adiciona o parâmetro 'query' se fornecido.
		if (params?.query) {
			httpParams = httpParams.set('query', params.query);
		}

		return this.http.get<RequestInterface[]>(this.requestUrl, {
			params: httpParams,
		});
	}

	/**
	 * Obtém as cópias de uma solicitação por ID da solicitação.
	 *
	 * @param {number} [requestId] O ID da solicitação para obter as cópias.
	 * @param {string} [query] Uma string de consulta opcional para filtrar as cópias.
	 * @returns {Observable<CopyInterface[]>} Um Observable que emite um array de cópias.
	 */
	getCopiesByRequestId(
		requestId: number,
		query?: string
	): Observable<CopyInterface[]> {
		// Cria um objeto HttpParams para adicionar o parâmetro de consulta.
		let httpParams = new HttpParams();
		if (query) httpParams = httpParams.set('query', query);

		return this.http.get<CopyInterface[]>(this.copyUrl + '/' + requestId, {
			params: httpParams,
		});
	}

	/**
	 * Obtém uma solicitação por ID.
	 *
	 * @param {number} id O ID da solicitação a ser obtida.
	 * @returns {Observable<RequestInterface>} Um Observable que emite a solicitação correspondente.
	 */
	getRequestById(id: number): Observable<RequestInterface> {
		return this.http.get<RequestInterface>(this.requestUrl + '/' + id);
	}

	/**
	 * Remove uma solicitação por ID.
	 *
	 * @param {number} id O ID da solicitação a ser removida.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição.
	 */
	removeRequestById(id: number): Observable<any> {
		return this.http.delete<any>(this.requestUrl + '/' + id);
	}

	/**
	 * Atualiza uma cópia dentro de uma solicitação existente.
	 *
	 * @param {CopyInterface} copyToPatch A cópia a ser atualizada.
	 * @param {RequestInterface} request A solicitação que contém a cópia.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição de edição.
	 */
	patchCopy(
		copyToPatch: CopyInterface,
		request: RequestInterface
	): Observable<any> {
		let copyIndex: number = -1;
		try {
			// Busca o índice da cópia a ser editada na lista de cópias da solicitação.
			copyIndex = this.findCopyIndexInRequest(request, copyToPatch.id);
		} catch (error) {
			// Retorna um Observable de erro se a cópia não for encontrada ou a solicitação for inválida.
			return throwError(() => error);
		}

		// Atualiza a cópia dentro da requisição
		request.copies![copyIndex] = copyToPatch;

		// Recalcula o número total de páginas da solicitação.
		var counter = 0;
		request.copies!.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		// Retorna a requisição de edição da solicitação com a cópia atualizada.
		return this.editRequest(
			request.id!,
			[],
			request.copies!,
			request.term / (60 * 60), // Converte o prazo de segundos para horas.
			counter
		);
	}

	/**
	 * Remove uma cópia de uma solicitação existente pelo ID da cópia.
	 *
	 * @param {number} copyIdForRemoval O ID da cópia a ser removida.
	 * @param {RequestInterface} request A solicitação que contém a cópia.
	 * @returns {Observable<any>} Um Observable que emite a resposta da requisição de edição.
	 */
	removeCopyById(
		copyIdForRemoval: number,
		request: RequestInterface
	): Observable<any> {
		let copyIndex: number = -1;
		try {
			// Busca o índice da cópia a ser removida na lista de cópias da solicitação.
			copyIndex = this.findCopyIndexInRequest(request, copyIdForRemoval);
		} catch (error) {
			// Retorna um Observable de erro se a cópia não for encontrada ou a solicitação for inválida.
			return throwError(() => error);
		}

		// Remove a cópia pelo índice
		request.copies!.splice(copyIndex, 1);

		// Recalcula o número total de páginas da solicitação.
		var counter = 0;
		request.copies!.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		// Retorna a requisição de edição da solicitação com a cópia removida.
		return this.editRequest(
			request.id!,
			[],
			request.copies!,
			request.term / (60 * 60), // Converte o prazo de segundos para horas.
			counter
		);
	}

	/**
	 * Encontra o índice de uma cópia em uma solicitação.
	 *
	 * @private
	 * @param {RequestInterface} request A solicitação que contém a cópia.
	 * @param {number} [id] O ID da cópia a ser encontrada.
	 * @returns {number} O índice da cópia na lista de cópias da solicitação.
	 * @throws {Error} Se a solicitação for inválida ou a cópia não pertencer à solicitação.
	 */
	private findCopyIndexInRequest(
		request: RequestInterface,
		id?: number
	): number {
		// Verifica se solicitação é válida e há cópias anexas
		if (!request.id || !request.copies?.length)
			throw new Error('Solicitação inválida');
		
		// Verifica se ID da cópia a ser comparada é válido
		if (!id) throw new Error('ID de cópia inválido');

		// Verifica se a cópia a ser removida existe
		const copyIndex = request.copies.findIndex((copy) => copy.id === id);

		// Verifica se a cópia foi encontrada na lista de cópias.
		if (copyIndex === -1)
			throw new Error('Cópia não pertence à solicitação');

		// Retorna o índice da cópia.
		return copyIndex;
	}

	/**
	 * Faz o download de um arquivo de uma solicitação.
	 *
	 * @param {number} requestId O ID da solicitação que contém o arquivo.
	 * @param {string} filename O nome do arquivo a ser baixado.
	 * @returns {Observable<FileDownloadResponse>} Um Observable que emite a resposta do download do arquivo.
	 */
	downloadFile(
		requestId: number,
		filename: string
	): Observable<FileDownloadResponse> {
		// Faz a requisição GET para obter o arquivo como um Blob.
		return this.http
			.get(this.requestUrl + '/' + requestId + '/' + filename, {
				observe: 'response',
				responseType: 'blob',
			})
			.pipe(
				// Mapeia a resposta HTTP para um objeto FileDownloadResponse.
				map((response: HttpResponse<Blob>) => ({
					filename: filename,
					data: response.body!,
				}))
			);
	}

	/**
	 * Gera um relatório de solicitações.
	 *
	 * @param {RequestInterface[]} requests A lista de solicitações para gerar o relatório.
	 * @returns {Observable<string>} Um Observable que emite o relatório gerado como texto.
	 */
	generateReport(requests: RequestInterface[]): Observable<string> {
		// Faz a requisição POST para gerar o relatório com a lista de solicitações fornecida.
		// Resposta em formato de texto HTML
		return this.http.post(this.reportUrl, requests, {
			responseType: 'text',
		});
	}

	/**
	 * Calcula o número total de páginas com base em um intervalo de páginas fornecido.
	 *
	 * @param {string} interval Uma string representando o intervalo de páginas, como "1-5,8,10-12".
	 * @returns {number} O número total de páginas calculadas.
	 */
	calcPagesByInterval(interval: string): number {
		// Verifica se o intervalo é vazio ou nulo.
		if (!interval || interval.trim() === '') return 0;

		let totalPages = 0;

		// Divide o intervalo em partes separadas por vírgula.
		const ranges = interval.split(',');

		// Itera sobre cada parte do intervalo.
		for (const range of ranges) {
			// Divide a parte do intervalo em partes separadas por hífen.
			const parts = range.trim().split('-');

			// Verifica se a parte do intervalo representa um intervalo de páginas (por exemplo, "1-5").
			if (parts.length === 2) {
				// Lidar com intervalos do tipo "1-5"
				const start = parseInt(parts[0], 10);
				const end = parseInt(parts[1], 10);

				// Verifica se os números são válidos e se o intervalo é válido (start <= end).
				if (!isNaN(start) && !isNaN(end) && start <= end) {
					// Adiciona o número de páginas no intervalo ao total.
					totalPages += end - start + 1;
				}
			} else if (parts.length === 1) {
				// Verifica se a parte do intervalo representa uma página única (por exemplo, "8").
				const page = parseInt(parts[0], 10);

				// Verifica se o número da página é válido e adiciona 1 ao total de páginas
				if (!isNaN(page)) {
					totalPages += 1;
				}
			}
		}

		// Retorna o número total de páginas calculadas.
		return totalPages;
	}

	/*********************/
	/** Métodos privados */

	/**
	 * Obtém o usuário atual.
	 *
	 * @private
	 * @returns {UserData} O objeto de dados do usuário atual.
	 * @throws {Error} Se nenhum usuário for encontrado.
	 */
	private getCurrentUser(): UserData {
		// Obtém o usuário atual.
		let currentUser = this.userService.getCurrentUser();
		if (!currentUser) {
			throw new Error(
				'Nenhum usuário encontrado. Não foi possível enviar requisição.'
			);
		}

		if (!currentUser.nome_usual || !currentUser.matricula) {
			throw new Error(
				'Dados de usuário incompletos. Não foi possível enviar requisição.'
			);
		}

		return currentUser;
	}

	/**
	 * Constrói um objeto FormData e HttpHeaders para enviar uma solicitação com arquivos.
	 *
	 * @private
	 * @param {Partial<RequestInterface>} request O objeto de solicitação parcial.
	 * @param {File[]} files A lista de arquivos a serem anexados à solicitação.
	 * @returns {{ formData: FormData; headers: HttpHeaders }} Um objeto contendo o FormData e os HttpHeaders.
	 */
	private buildRequest(
		request: Partial<RequestInterface>,
		files: File[]
	): { formData: FormData; headers: HttpHeaders } {
		// Cria um objeto FormData para enviar os dados da solicitação e os arquivos.
		const formData = new FormData();

		// Adiciona o objeto de solicitação como um blob JSON ao FormData.
		formData.append(
			'solicitacao',
			new Blob([JSON.stringify(request)], {
				type: 'application/json',
			})
		);

		// Adiciona cada arquivo ao FormData.
		files.forEach((file) => {
			formData.append('arquivos', file);
		});

		// Define os headers da requisição.
		let headers = new HttpHeaders();
		headers.append('Accept', 'application/json');
		headers.append('Content-Type', 'multipart/form-data');

		return { formData: formData, headers: headers };
	}
}
