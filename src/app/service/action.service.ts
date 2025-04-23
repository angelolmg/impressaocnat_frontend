import { EventEmitter, inject, Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';
import { SolicitationInterface } from '../models/solicitation.interface';
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
	viewSolicitation = 'Solicitação',
	newSolicitation = 'Nova Solicitação',
	editSolicitation = 'Editar Solicitação',
	viewAllSolicitations = 'Todas as Solicitações',
	viewMySolicitations = 'Minhas Solicitações',
}

/**
 * Mapeamento dos tipos de página para suas respectivas rotas.
 */
export const pageStateRoutes: { [key in PageState]: string } = {
	[PageState.viewSolicitation]: 'ver/:id',
	[PageState.newSolicitation]: 'nova-solicitacao',
	[PageState.editSolicitation]: 'editar/:id',
	[PageState.viewAllSolicitations]: 'solicitacoes',
	[PageState.viewMySolicitations]: 'minhas-solicitacoes',
};

/**
 * Mapeamento das rotas para seus respectivos tipos de página.
 */
export const routePageStates: { [key: string]: PageState | undefined } = {
	'ver/:id': PageState.viewSolicitation,
	'nova-solicitacao': PageState.newSolicitation,
	'editar/:id': PageState.editSolicitation,
	solicitacoes: PageState.viewAllSolicitations,
	'minhas-solicitacoes': PageState.viewMySolicitations,
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
	allowedActionsforViewSolicitations: [
		ActionType.VISUALIZAR,
		ActionType.FECHAR,
		ActionType.ABRIR,
		ActionType.EDITAR,
		ActionType.EXCLUIR,
	],

	allowedActionsforEditSolicitation: [ActionType.EDITAR, ActionType.EXCLUIR],
	allowedActionsforNewSolicitation: [ActionType.EDITAR, ActionType.EXCLUIR],
	allowedActionsforViewSolicitation: [ActionType.BAIXAR, ActionType.EXCLUIR],
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
export interface UserProfile {
	registration: string;
	name: string;
	pfp: string;
}

/**
 * Informações padrão do usuário quando nenhum usuário está logado ou as informações não estão disponíveis.
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
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
		text: PageState.newSolicitation,
		routerLink: pageStateRoutes[PageState.newSolicitation],
	},
	{
		icon: 'list',
		text: PageState.viewMySolicitations,
		routerLink: pageStateRoutes[PageState.viewMySolicitations],
	},
];

/**
 * Opções da barra de navegação para um usuário administrador.
 */
export const ADMIN_USER_OPTIONS: Option[] = [
	{
		icon: 'receipt_long',
		text: PageState.viewAllSolicitations,
		routerLink: pageStateRoutes[PageState.viewAllSolicitations],
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
	deleteSolicitation = new EventEmitter<SolicitationInterface>();
	editSolicitation = new EventEmitter<SolicitationInterface>();
	viewSolicitation = new EventEmitter<SolicitationInterface>();
	openSolicitation = new EventEmitter<SolicitationInterface>();
	toggleSolicitationStatus = new EventEmitter<SolicitationInterface>();

	// Emissor de evento de abertura/fechamento do menu lateral
	toggleSideMenuUI = new EventEmitter();

	// Serviços
	userService = inject(UserService);

	/** Verifica se objeto é instância de SolicitationInterface (é um objeto de solicitação) */
	instanceOfSolicitation(object: any): object is SolicitationInterface {
		return CREATION_DATE_KEY in object;
	}

	/** Verifica se objeto é instância de CopyInterface (é um objeto de cópia) */
	instanceOfCopy(object: any): object is CopyInterface {
		return FILE_NAME_KEY in object;
	}

	/**
	 * Determina se um botão de ação deve ser oculto com base no componente, estado da página, ação e elemento.
	 *
	 * @param {SolicitationInterface} [element] O elemento de solicitação relacionado à ação.
	 * @param {string} [component] O nome do componente (na pasta /pages) que está usando o handler.
	 * @param {PageState} [state] O estado atual da página.
	 * @param {ActionType} [action] A ação do botão.
	 * @returns {boolean} Retorna `true` se o botão deve ser oculto, `false` caso contrário.
	 */
	hiddenHandler(
		element: SolicitationInterface,
		component?: string,
		state?: PageState,
		action?: ActionType
	): boolean {
		const isViewMySolicitations = state === PageState.viewMySolicitations;
		const isUserAdmin = this.userService.isUserAdmin();

		// Deve ocultar a ação se:
		switch (action) {
			// For uma ação de ABRIR...
			case ActionType.ABRIR:
				// ...e NÃO tiver data de conclusão OU (estiver no estado de visualização de solicitações E o usuario não for admin)
				return (
					!element.conclusionDate ||
					(isViewMySolicitations && !isUserAdmin)
				);
			// For uma ação de FECHAR...
			case ActionType.FECHAR:
				// ...e TIVER data de conclusão OU (estiver no estado de visualização de solicitações E o usuario não for admin)
				return (
					!!element.conclusionDate ||
					(isViewMySolicitations && !isUserAdmin)
				);
			default:
				// Caso contrário, não oculte a ação
				return false;
		}
	}

	/**
	 * Controla se determinadas opções são desabilitadas, dependendo do contexto (tela), ação e elemento a ser modificado.
	 *
	 * @param {SolicitationInterface | CopyInterface} [element] O elemento de solicitação ou cópia relacionado à ação.
	 * @param {string} [component] O nome do componente (na pasta /pages) que está usando o handler.
	 * @param {PageState} [state] O estado atual da página.
	 * @param {ActionType} [action] A ação do botão.
	 * @param {SolicitationInterface} [parentElement] O elemento de solicitação pai, se o elemento for uma cópia.
	 * @returns {boolean} Retorna `true` se o botão deve ser desabilitado, `false` caso contrário.
	 */
	disabledHandler(
		element: SolicitationInterface | CopyInterface,
		component: string,
		state?: PageState,
		action?: ActionType,
		parentElement?: SolicitationInterface
	): boolean {
		const isSolicitation = this.instanceOfSolicitation(element);
		const concludedSolicitation = isSolicitation ? !!element.conclusionDate : false;
		const archivedSolicitation = isSolicitation ? element.archived : parentElement?.archived;

		const isCopy = this.instanceOfCopy(element);

		// Desabilita todas as ações de cópias caso a solicitação esteja arquivada
		if (isCopy && archivedSolicitation) return true;

		// Desabilita todas as ações de edição de cópias caso a solicitação esteja concluída
		if (
			isCopy &&
			parentElement?.conclusionDate &&
			state === PageState.editSolicitation
		)
			return true;

		// Desabilita todas as ações, exceto visualização, de uma solicitação arquivada
		if (isSolicitation && archivedSolicitation && action !== ActionType.VISUALIZAR)
			return true;

		// Desabilita botões de 'Excluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída) mas não obsoleta/arquivada.
		if (
			isSolicitation &&
			['view-solicitation', 'list-solicitations'].includes(component) &&
			concludedSolicitation &&
			!archivedSolicitation &&
			(action === ActionType.EXCLUIR || action === ActionType.EDITAR)
		) {
			return true;
		}

		// Desabilitar botão de 'Baixar' (download) para cópia cujo arquivo não está em disco ou é arquivo físico ou solicitação está arquivada
		if (
			isCopy &&
			['view-solicitation'].includes(component) &&
			(!element.fileInDisk || element.isPhysicalFile || archivedSolicitation) &&
			action === ActionType.BAIXAR
		) {
			return true;
		}

		// Desabilitar botão de 'Excluir' para cópia caso solicitação esteja fechada.
		if (
			isCopy &&
			['view-solicitation'].includes(component) &&
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
	 * @param {SolicitationInterface | CopyInterface} element O elemento (solicitação ou cópia) associado à ação.
	 * @returns {void}
	 */
	private emitAction(
		action: ActionType,
		element: SolicitationInterface | CopyInterface
	): void {
		// Cria um mapa que associa tipos de ação a eventos emissores.
		const actionMap = new Map<ActionType, EventEmitter<any>>([
			[
				ActionType.EXCLUIR,
				this.instanceOfCopy(element)
					? this.deleteCopy // Se for uma cópia, emite o evento deleteCopy.
					: this.deleteSolicitation, // Se for uma solicitação, emite o evento deleteSolicitation.
			],
			[
				ActionType.EDITAR,
				this.instanceOfCopy(element) ? this.editCopy : this.editSolicitation,
			],
			[ActionType.VISUALIZAR, this.viewSolicitation],
			[ActionType.BAIXAR, this.downloadCopy],
			[ActionType.FECHAR, this.toggleSolicitationStatus],
			[ActionType.ABRIR, this.toggleSolicitationStatus],
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
	 * @param {SolicitationInterface | CopyInterface} element O elemento (solicitação ou cópia) associado à ação.
	 * @param {string} component O nome do componente que disparou a ação.
	 * @param {PageState} [state] O estado da página atual.
	 * @returns {void}
	 */
	callbackHandler(
		action: ActionType,
		element: SolicitationInterface | CopyInterface,
		component: string,
		state?: PageState
	): void {
		// Mudar última página visitada caso alguma ação de redirecinamento seja acionada
		// No caso, ações de visualização e edição (nas telas de listagens) redirecionam o usuário e possibilitam retorno
		if (
			state &&
			['list-solicitations'].includes(component) &&
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
