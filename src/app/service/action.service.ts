import { EventEmitter, Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';
import { RequestInterface } from './../models/request.interface';

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

export enum ActionType {
	VISUALIZAR = 'Visualizar',
	FECHAR = 'Fechar',
	EDITAR = 'Editar',
	EXCLUIR = 'Excluir',
	ABRIR = 'Abrir',
	BAIXAR = 'Baixar',
}

export const actions = {
	allowedActionsforViewAllRequests: [
		ActionType.VISUALIZAR,
		ActionType.FECHAR,
		ActionType.ABRIR,
		ActionType.EDITAR,
		ActionType.EXCLUIR,
	],

	allowedActionsforViewMyRequests: [
		ActionType.VISUALIZAR,
		ActionType.EDITAR,
		ActionType.EXCLUIR,
	],
	allowedActionsforEditRequest: [ActionType.EDITAR, ActionType.EXCLUIR],
	allowedActionsforNewRequest: [ActionType.EXCLUIR],
	allowedActionsforViewRequest: [
		ActionType.BAIXAR,
		ActionType.EDITAR,
		ActionType.EXCLUIR,
	],
};

const CREATION_DATE_KEY = 'creationDate';
const FILE_NAME_KEY = 'fileName';

@Injectable({
	providedIn: 'root',
})
export class ActionService {
	deleteCopy = new EventEmitter<CopyInterface>();
	editCopy = new EventEmitter<CopyInterface>();
	downloadCopy = new EventEmitter<CopyInterface>();
	deleteRequest = new EventEmitter<RequestInterface>();
	editRequest = new EventEmitter<RequestInterface>();
	viewRequest = new EventEmitter<RequestInterface>();
	openRequest = new EventEmitter<RequestInterface>();
	closeRequest = new EventEmitter<RequestInterface>();

	constructor() {}

	// Verifica se objeto é instância de RequestInterface (é um objeto de solicitação)
	instanceOfRequest(object: any): object is RequestInterface {
		return CREATION_DATE_KEY in object;
	}

	// Verifica se objeto é instância de CopyInterface (é um objeto de cópia)
	instanceOfCopy(object: any): object is CopyInterface {
		return FILE_NAME_KEY in object;
	}

	// Controla se determinadas opções são, ou não, desabilidadas a depender do contexto (tela), ação e elemento a ser modificado
	disabledHandler(
		component?: string,
		state?: PageType,
		action?: ActionType,
		element?: RequestInterface | CopyInterface
	) {
		switch (component) {
			case 'list-requests':
				// Desabilitar botões de 'Concluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída)
				if (
					this.instanceOfRequest(element) &&
					element.conclusionDate &&
					(action == ActionType.EXCLUIR ||
						action == ActionType.EDITAR)
				)
					return true;
				break;
		}

		return false;
	}

	private emitAction(
		action: ActionType,
		element: RequestInterface | CopyInterface
	  ): void {
		const actionMap = new Map<ActionType, EventEmitter<any>>([
		  [ActionType.EXCLUIR, this.instanceOfCopy(element) ? this.deleteCopy : this.deleteRequest],
		  [ActionType.EDITAR, this.instanceOfCopy(element) ? this.editCopy : this.editRequest],
		  [ActionType.VISUALIZAR, this.viewRequest],
		  [ActionType.BAIXAR, this.downloadCopy],
		  [ActionType.FECHAR, this.closeRequest],
		  [ActionType.ABRIR, this.openRequest],
		]);
	
		const emitter = actionMap.get(action);
		if (emitter) {
		  emitter.emit(element);
		}
	  }

	  callbackHandler(
		  action?: ActionType,
		  element?: RequestInterface | CopyInterface,
		  component?: string,
		  state?: PageType,
	  ): void {
		if (!element || !action) {
		  console.warn('Action or element is missing.');
		  return;
		}
	
		this.emitAction(action, element);
	  }
}
