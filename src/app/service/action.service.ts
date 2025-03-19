import { EventEmitter, inject, Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';
import { RequestInterface } from './../models/request.interface';
import { UserService } from './user.service';

/**
 * Gerencia o estado dos botões de ação em componentes de listagem.
 * Define quais botões estarão habilitados, ocultos ou inativos,
 * e especifica as ações que cada botão realizará, levando em consideração o componente em questão,
 * o estado atual da página, a ação a ser executada e o elemento selecionado.
 */

/**
 * Enumeração que define os tipos de página disponíveis na aplicação.
 */
export enum PageState {
	viewRequest = 'Solicitação',
	newRequest = 'Nova Solicitação',
	editRequest = 'Editar Solicitação',
	viewAllRequests = 'Todas as Solicitações',
	viewMyRequests = 'Minhas Solicitações',
}

/**
 * Mapeamento dos tipos de página para suas respectivas rotas.
 */
export const pageStateRoutes: { [key in PageState]: string } = {
	[PageState.viewRequest]: 'ver/:id',
	[PageState.newRequest]: 'nova-solicitacao',
	[PageState.editRequest]: 'editar/:id',
	[PageState.viewAllRequests]: 'solicitacoes',
	[PageState.viewMyRequests]: 'minhas-solicitacoes',
};

/**
 * Mapeamento das rotas para seus respectivos tipos de página.
 */
export const routePageStates: { [key: string]: PageState | undefined } = {
	'ver/:id': PageState.viewRequest,
	'nova-solicitacao': PageState.newRequest,
	'editar/:id': PageState.editRequest,
	solicitacoes: PageState.viewAllRequests,
	'minhas-solicitacoes': PageState.viewMyRequests,
};

/**
 * Enumeração que define os tipos de ação disponíveis na aplicação.
 */
export enum ActionType {
	VISUALIZAR = 'Visualizar',
	FECHAR = 'Fechar',
	EDITAR = 'Editar',
	EXCLUIR = 'Excluir',
	ABRIR = 'Abrir',
	BAIXAR = 'Baixar',
	DETALHES = 'Detalhes',
}

/**
 * Objeto que define as ações permitidas para cada tipo de página.
 */
export const actions = {
	allowedActionsforViewRequests: [
		ActionType.VISUALIZAR,
		ActionType.FECHAR,
		ActionType.ABRIR,
		ActionType.EDITAR,
		ActionType.EXCLUIR,
	],

	allowedActionsforEditRequest: [ActionType.EDITAR, ActionType.EXCLUIR],
	allowedActionsforNewRequest: [ActionType.EDITAR, ActionType.EXCLUIR],
	allowedActionsforViewRequest: [ActionType.BAIXAR, ActionType.EXCLUIR],
};

// Gerencia botões e rotas da barra de navegação, além do display padrão do usuário

/**
 * Interface que define a estrutura de uma opção da barra de navegação.
 */
export interface Option {
	icon: string;
	text: string;
	routerLink: string;
}

/**
 * Interface que define a estrutura de um usuário (usado no display).
 */
export interface User {
	registration: string;
	name: string;
	pfp: string;
}

/**
 * Informações padrão do usuário quando nenhum usuário está logado ou as informações não estão disponíveis.
 */
export const DEFAULT_USER_INFO: User = {
	registration: '-',
	name: '-',
	pfp: 'assets/user-01.svg',
};

/**
 * Opções padrão da barra de navegação para um usuário comum.
 */
export const DEFAULT_USER_OPTIONS: Option[] = [
	{
		icon: 'add_circle',
		text: PageState.newRequest,
		routerLink: pageStateRoutes[PageState.newRequest],
	},
	{
		icon: 'list',
		text: PageState.viewMyRequests,
		routerLink: pageStateRoutes[PageState.viewMyRequests],
	},
];

/**
 * Opções da barra de navegação para um usuário administrador.
 */
export const ADMIN_USER_OPTIONS: Option[] = [
	{
		icon: 'receipt_long',
		text: PageState.viewAllRequests,
		routerLink: pageStateRoutes[PageState.viewAllRequests],
	},
];

/**
 * Chaves usadas na averiguação de diferentes interfaces
 */
const CREATION_DATE_KEY = 'creationDate';
const FILE_NAME_KEY = 'fileName';

@Injectable({
	providedIn: 'root',
})
export class ActionService {
	// Emissores de eventos para diferentes ações dentro da aplicação
	deleteCopy = new EventEmitter<CopyInterface>();
	editCopy = new EventEmitter<CopyInterface>();
	downloadCopy = new EventEmitter<CopyInterface>();
	deleteRequest = new EventEmitter<RequestInterface>();
	editRequest = new EventEmitter<RequestInterface>();
	viewRequest = new EventEmitter<RequestInterface>();
	openRequest = new EventEmitter<RequestInterface>();
	toggleRequestStatus = new EventEmitter<RequestInterface>();

	// Emissor de evento de abertura/fechamento do menu lateral
	toggleSideMenuUI = new EventEmitter();

	// Serviços
	userService = inject(UserService);

	/** Verifica se objeto é instância de RequestInterface (é um objeto de solicitação) */
	instanceOfRequest(object: any): object is RequestInterface {
		return CREATION_DATE_KEY in object;
	}

	/** Verifica se objeto é instância de CopyInterface (é um objeto de cópia) */
	instanceOfCopy(object: any): object is CopyInterface {
		return FILE_NAME_KEY in object;
	}

	/**
	 * Determina se um botão de ação deve ser oculto com base no componente, estado da página, ação e elemento.
	 *
	 * @param {RequestInterface} [element] O elemento de solicitação relacionado à ação.
	 * @param {string} [component] O nome do componente (na pasta /pages) que está usando o handler.
	 * @param {PageState} [state] O estado atual da página.
	 * @param {ActionType} [action] A ação do botão.
	 * @returns {boolean} Retorna `true` se o botão deve ser oculto, `false` caso contrário.
	 */
	hiddenHandler(
		element: RequestInterface,
		component?: string,
		state?: PageState,
		action?: ActionType
	): boolean {
		const isViewMyRequests = state === PageState.viewMyRequests;
		const isUserAdmin = this.userService.isUserAdmin();

		// Deve ocultar a ação se:
		switch (action) {
			// For uma ação de ABRIR...
			case ActionType.ABRIR:
				// ...e NÃO tiver data de conclusão OU (estiver no estado de visualização de solicitações E o usuario não for admin)
				return (
					!element.conclusionDate ||
					(isViewMyRequests && !isUserAdmin)
				);
			// For uma ação de FECHAR...
			case ActionType.FECHAR:
				// ...e TIVER data de conclusão OU (estiver no estado de visualização de solicitações E o usuario não for admin)
				return (
					!!element.conclusionDate ||
					(isViewMyRequests && !isUserAdmin)
				);
			default:
				// Caso contrário, não oculte a ação
				return false;
		}
	}

	/**
	 * Controla se determinadas opções são desabilitadas, dependendo do contexto (tela), ação e elemento a ser modificado.
	 *
	 * @param {RequestInterface | CopyInterface} [element] O elemento de solicitação ou cópia relacionado à ação.
	 * @param {string} [component] O nome do componente (na pasta /pages) que está usando o handler.
	 * @param {PageState} [state] O estado atual da página.
	 * @param {ActionType} [action] A ação do botão.
	 * @param {RequestInterface} [parentElement] O elemento de solicitação pai, se o elemento for uma cópia.
	 * @returns {boolean} Retorna `true` se o botão deve ser desabilitado, `false` caso contrário.
	 */
	disabledHandler(
		element: RequestInterface | CopyInterface,
		component: string,
		state?: PageState,
		action?: ActionType,
		parentElement?: RequestInterface
	): boolean {
		const isRequest = this.instanceOfRequest(element);
		const concludedRequest = isRequest ? !!element.conclusionDate : false;
		const staleRequest = isRequest ? element.stale : parentElement?.stale;

		const isCopy = this.instanceOfCopy(element);

		// Desabilita todas as ações de cópias caso a solicitação esteja arquivada
		if (isCopy && staleRequest) return true;

		// Desabilita todas as ações de edição de cópias caso a solicitação esteja concluída
		if (
			isCopy &&
			parentElement?.conclusionDate &&
			state === PageState.editRequest
		)
			return true;

		// Desabilita todas as ações, exceto visualização, de uma solicitação arquivada
		if (isRequest && staleRequest && action !== ActionType.VISUALIZAR)
			return true;

		// Desabilita botões de 'Excluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída) mas não obsoleta/arquivada.
		if (
			isRequest &&
			['view-request', 'list-requests'].includes(component) &&
			concludedRequest &&
			!staleRequest &&
			(action === ActionType.EXCLUIR || action === ActionType.EDITAR)
		) {
			return true;
		}

		// Desabilitar botão de 'Baixar' (download) para cópia cujo arquivo não está em disco ou é arquivo físico ou solicitação está arquivada
		if (
			isCopy &&
			['view-request'].includes(component) &&
			(!element.fileInDisk || element.isPhysicalFile || staleRequest) &&
			action === ActionType.BAIXAR
		) {
			return true;
		}

		// Desabilitar botão de 'Excluir' para cópia caso solicitação esteja fechada.
		if (
			isCopy &&
			['view-request'].includes(component) &&
			parentElement?.conclusionDate &&
			action === ActionType.EXCLUIR
		) {
			return true;
		}

		return false;
	}

	/**
	 * Emite um evento de ação com base no tipo de ação e no elemento fornecido.
	 *
	 * @private
	 * @param {ActionType} action O tipo de ação a ser emitida.
	 * @param {RequestInterface | CopyInterface} element O elemento (solicitação ou cópia) associado à ação.
	 * @returns {void}
	 */
	private emitAction(
		action: ActionType,
		element: RequestInterface | CopyInterface
	): void {
		// Cria um mapa que associa tipos de ação a eventos emissores.
		const actionMap = new Map<ActionType, EventEmitter<any>>([
			[
				ActionType.EXCLUIR,
				this.instanceOfCopy(element)
					? this.deleteCopy // Se for uma cópia, emite o evento deleteCopy.
					: this.deleteRequest, // Se for uma solicitação, emite o evento deleteRequest.
			],
			[
				ActionType.EDITAR,
				this.instanceOfCopy(element) ? this.editCopy : this.editRequest,
			],
			[ActionType.VISUALIZAR, this.viewRequest],
			[ActionType.BAIXAR, this.downloadCopy],
			[ActionType.FECHAR, this.toggleRequestStatus],
			[ActionType.ABRIR, this.toggleRequestStatus],
		]);

		// Obtém o evento emissor correspondente ao tipo de ação.
		const emitter = actionMap.get(action);

		// Se um evento emissor for encontrado, emite o evento com o elemento fornecido.
		if (emitter) {
			emitter.emit(element);
		}
	}

	/**
	 * Lida com o callback de uma ação, realizando ações específicas com base no tipo de ação, elemento e contexto.
	 *
	 * @param {ActionType} action O tipo de ação a ser tratada.
	 * @param {RequestInterface | CopyInterface} element O elemento (solicitação ou cópia) associado à ação.
	 * @param {string} component O nome do componente que disparou a ação.
	 * @param {PageState} [state] O estado da página atual.
	 * @returns {void}
	 */
	callbackHandler(
		action: ActionType,
		element: RequestInterface | CopyInterface,
		component: string,
		state?: PageState
	): void {
		// Mudar última página visitada caso alguma ação de redirecinamento seja acionada
		// No caso, ações de visualização e edição (nas telas de listagens) redirecionam o usuário e possibilitam retorno
		if (
			state &&
			['list-requests'].includes(component) &&
			[ActionType.VISUALIZAR, ActionType.EDITAR].includes(action)
		)
			localStorage.setItem('lastPageState', pageStateRoutes[state]);

		// Emite o evento de ação correspondente.
		this.emitAction(action, element);
	}

	/**
	 * Obtém o último estado da página armazenado no localStorage.
	 *
	 * @param {boolean} [asRoute] Indica se o estado deve ser retornado como uma rota (true) ou como o nome do estado (false).
	 * @returns {string | undefined} Retorna o último estado da página como uma string ou undefined se não houver estado armazenado.
	 */
	getLastPageState(asRoute?: boolean): string | undefined {
		let pageState = localStorage.getItem('lastPageState');
		if (pageState) {
			if (asRoute) return pageState;
			else return routePageStates[pageState] as string;
		}

		// Se o estado da página não existir no localStorage, retorna undefined.
		return undefined;
	}
}
