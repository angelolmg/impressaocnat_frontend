import { EventEmitter, inject, Injectable } from '@angular/core';
import { NewCopyFormData } from '../models/copy.interface';
import { RequestInterface } from './../models/request.interface';
import { UserService } from './user.service';

// Gerencia o estado dos botões de ação em componentes de listagem. Define quais botões estarão habilitados, ocultos ou inativos,
// e especifica as ações que cada botão realizará, levando em consideração o componente em questão, o estado atual da página,
// a ação a ser executada e o elemento selecionado.

export enum PageType {
	viewRequest = 'Solicitação',
	newRequest = 'Nova Solicitação',
	editRequest = 'Editar Solicitação',
	viewAllRequests = 'Todas as Solicitações',
	viewMyRequests = 'Minhas Solicitações',
}

export const pageTypeRoutes: { [key in PageType]: string } = {
	[PageType.viewRequest]: 'ver/:id',
	[PageType.newRequest]: 'nova-solicitacao',
	[PageType.editRequest]: 'editar/:id',
	[PageType.viewAllRequests]: 'solicitacoes',
	[PageType.viewMyRequests]: 'minhas-solicitacoes',
};

export const routePageTypes: { [key: string]: PageType | undefined } = {
	'ver/:id': PageType.viewRequest,
	'nova-solicitacao': PageType.newRequest,
	'editar/:id': PageType.editRequest,
	solicitacoes: PageType.viewAllRequests,
	'minhas-solicitacoes': PageType.viewMyRequests,
};

export enum ActionType {
	VISUALIZAR = 'Visualizar',
	FECHAR = 'Fechar',
	EDITAR = 'Editar',
	EXCLUIR = 'Excluir',
	ABRIR = 'Abrir',
	BAIXAR = 'Baixar',
}

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
	allowedActionsforViewRequest: [
		ActionType.BAIXAR,
		ActionType.EXCLUIR,
	],
};

// Gerencia botões e rotas da barra de navegação, além do display padrão do usuário

export interface Option {
	icon: string;
	text: string;
	routerLink: string;
}

export interface User {
	registration: string;
	name: string;
	pfp: string;
}

export const DEFAULT_USER_INFO: User = {
	registration: '-',
	name: '-',
	pfp: 'assets/user-01.svg',
};

export const DEFAULT_USER_OPTIONS: Option[] = [
	{
		icon: 'add_circle',
		text: PageType.newRequest,
		routerLink: pageTypeRoutes[PageType.newRequest],
	},
	{
		icon: 'list',
		text: PageType.viewMyRequests,
		routerLink: pageTypeRoutes[PageType.viewMyRequests],
	},
];

export const ADMIN_USER_OPTIONS: Option[] = [
	{
		icon: 'receipt_long',
		text: PageType.viewAllRequests,
		routerLink: pageTypeRoutes[PageType.viewAllRequests],
	},
];

const CREATION_DATE_KEY = 'creationDate';
const FILE_NAME_KEY = 'fileName';

@Injectable({
	providedIn: 'root',
})
export class ActionService {
	deleteCopy = new EventEmitter<NewCopyFormData>();
	editCopy = new EventEmitter<NewCopyFormData>();
	downloadCopy = new EventEmitter<NewCopyFormData>();
	deleteRequest = new EventEmitter<RequestInterface>();
	editRequest = new EventEmitter<RequestInterface>();
	viewRequest = new EventEmitter<RequestInterface>();
	openRequest = new EventEmitter<RequestInterface>();
	toggleRequest = new EventEmitter<RequestInterface>();

	toggleSideMenuUI = new EventEmitter();

	userService = inject(UserService);

	pageType: PageType | undefined;

	constructor() {}

	// Verifica se objeto é instância de RequestInterface (é um objeto de solicitação)
	instanceOfRequest(object: any): object is RequestInterface {
		return CREATION_DATE_KEY in object;
	}

	// Verifica se objeto é instância de NewCopyFormData (é um objeto de cópia)
	instanceOfCopy(object: any): object is NewCopyFormData {
		return FILE_NAME_KEY in object;
	}

	hiddenHandler(
		component?: string,
		state?: PageType,
		action?: ActionType,
		element?: RequestInterface
	) {
		if (
			element &&
			((action == ActionType.ABRIR && !element.conclusionDate) ||
				(action == ActionType.FECHAR && element.conclusionDate) ||
				(action == ActionType.ABRIR &&
					state == PageType.viewMyRequests &&
					!this.userService.isUserAdmin()) ||
				(action == ActionType.FECHAR &&
					state == PageType.viewMyRequests &&
					!this.userService.isUserAdmin()))
		)
			return true;

		return false;
	}

	// Controla se determinadas opções são, ou não, desabilidadas
	// a depender do contexto (tela), ação e elemento a ser modificado
	disabledHandler(
		component?: string,
		state?: PageType,
		action?: ActionType,
		element?: RequestInterface | NewCopyFormData,
		parentElement?: RequestInterface
	) {
		// Desabilitar todos os botões de ação para cópias caso a requisição seja obsoleta/arquivada
		if (
			component &&
			this.instanceOfCopy(element) &&
			parentElement?.stale
		)
			return true;

		// Desabilitar todas as ações (exceto visualização) caso solicitação seja obsoleta/arquivada
		if (
			component &&
			this.instanceOfRequest(element) &&
			element.stale &&
			action != ActionType.VISUALIZAR
		)
			return true;

		// Desabilitar botões de 'Concluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída) mas não obsoleta/arquivada
		if (
			component &&
			['view-request', 'list-requests'].includes(component) &&
			this.instanceOfRequest(element) &&
			(element.conclusionDate && !element.stale) &&
			(action == ActionType.EXCLUIR || action == ActionType.EDITAR)
		)
			return true;

		// Desabilitar botão de 'Baixar' (download) para cópia cujo arquivo não está em disco ou é arquivo físico
		if (
			component &&
			['view-request'].includes(component) &&
			this.instanceOfCopy(element) &&
			(!element.fileInDisk || element.isPhysicalFile || parentElement?.stale) &&
			action == ActionType.BAIXAR
		)
			return true;

		return false;
	}

	private emitAction(
		action: ActionType,
		element: RequestInterface | NewCopyFormData
	): void {
		const actionMap = new Map<ActionType, EventEmitter<any>>([
			[
				ActionType.EXCLUIR,
				this.instanceOfCopy(element)
					? this.deleteCopy
					: this.deleteRequest,
			],
			[
				ActionType.EDITAR,
				this.instanceOfCopy(element) ? this.editCopy : this.editRequest,
			],
			[ActionType.VISUALIZAR, this.viewRequest],
			[ActionType.BAIXAR, this.downloadCopy],
			[ActionType.FECHAR, this.toggleRequest],
			[ActionType.ABRIR, this.toggleRequest],
		]);

		const emitter = actionMap.get(action);
		if (emitter) {
			emitter.emit(element);
		}
	}

	callbackHandler(
		action: ActionType,
		element: RequestInterface | NewCopyFormData,
		component: string,
		state?: PageType
	): void {
		// Mudar última página visitada caso alguma ação de redirecinamento seja acionada
		// No caso, ações de visualização e edição (nas telas de listagens) redirecionam o usuário e possibilitam retorno
		if (
			state &&
			action &&
			['list-requests'].includes(component) &&
			[ActionType.VISUALIZAR, ActionType.EDITAR].includes(action)
		)
			localStorage.setItem('lastPageState', pageTypeRoutes[state]);

		if (!element || !action) {
			console.warn('Ação ou elemento faltando.');
			return;
		}

		this.emitAction(action, element);
	}

	getLastPageState(asRoute?: boolean): string | null {
		let pageState = localStorage.getItem('lastPageState');
		if (pageState) {
			if (asRoute) return pageState;
			else return routePageTypes[pageState] as string;
		}
		return null;
	}
}
