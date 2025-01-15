import { RequestInterface } from './../models/request.interface';
import { EventEmitter, Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';
import { Observable } from 'rxjs';

// Gerencia o estado dos botões de ação em componentes de listagem. Define quais botões estarão habilitados, ocultos ou inativos,
// e especifica as ações que cada botão realizará, levando em consideração o componente em questão, o estado atual da página,
// a ação a ser executada e o elemento selecionado.

export enum PageState {
	newRequest = 'Nova Solicitação',
	editRequest = 'Editar Solicitação',
	viewAllRequests = 'Todas as Solicitações',
	viewMyRequests = 'Minhas Solicitações',
}

export enum actionType {
	VISUALIZAR = 'Visualizar',
	CONCLUIR = 'Concluir',
	EDITAR = 'Editar',
	EXCLUIR = 'Excluir',
	ABRIR = 'Abrir',
	BAIXAR = 'Baixar',
}

export const actions = {
	allowedActionsforViewAllRequests: [
		actionType.VISUALIZAR,
		actionType.CONCLUIR,
		actionType.EDITAR,
		actionType.EXCLUIR,
		actionType.ABRIR,
	],

	allowedActionsforViewMyRequests: [
		actionType.VISUALIZAR,
		actionType.EDITAR,
		actionType.EXCLUIR,
	],
	allowedActionsforEditRequest: [actionType.EDITAR, actionType.EXCLUIR],
	allowedActionsforNewRequest: [actionType.EXCLUIR],
	allowedActionsforViewRequest: [
		actionType.EDITAR,
		actionType.EXCLUIR,
		actionType.BAIXAR,
	],
};

const CREATION_DATE_KEY = 'creation_date';
const FILE_NAME_KEY = 'file_name';

@Injectable({
	providedIn: 'root',
})
export class ActionService {
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
		state?: PageState,
		action?: actionType,
		element?: RequestInterface | CopyInterface
	) {
		switch (component) {
			case 'list-requests':
				// Desabilitar botões de 'Concluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída)
				if (
					this.instanceOfRequest(element) &&
					state == PageState.viewMyRequests &&
					element.conclusion_date &&
					(action == actionType.EXCLUIR ||
						action == actionType.EDITAR)
				)
					return true;
				break;
		}

		return false;
	}

	deleteCopy: EventEmitter<CopyInterface> = new EventEmitter();
	editCopy: EventEmitter<CopyInterface> = new EventEmitter();
	deleteRequest: EventEmitter<RequestInterface> = new EventEmitter();
	editRequest: EventEmitter<RequestInterface> = new EventEmitter();

	callbackHandler(
		component?: string,
		state?: PageState,
		action?: actionType,
		element?: RequestInterface | CopyInterface
	) {
		if (action == actionType.EXCLUIR) {
			if (this.instanceOfCopy(element)) {
				this.deleteCopy.emit(element);
			}
			if (this.instanceOfRequest(element)) {
				this.deleteRequest.emit(element);
			}
		}

		if (action == actionType.EDITAR) {
			if (this.instanceOfCopy(element)) {
				this.editCopy.emit(element);
			}

			if (this.instanceOfRequest(element)) {
				this.editRequest.emit(element);
			}
		}
	}
}
