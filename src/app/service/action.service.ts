import { RequestInterface } from './../models/request.interface';
import { Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';

// Gerencia o estado dos botões de ação em componentes de listagem. Define quais botões estarão habilitados, ocultos ou inativos, 
// e especifica as ações que cada botão realizará, levando em consideração o componente em questão, o estado atual da página, 
// a ação a ser executada e o elemento selecionado. 

export enum PageStates {
	newRequest = 'Nova Solicitação',
	editRequest = 'Editar Solicitação',
	viewAllRequests = 'Todas as Solicitações',
	viewMyRequests = 'Minhas Solicitações',
}

export const actions = {
	allActions: [
		'Visualizar',
		'Concluir',
		'Editar',
		'Excluir',
		'Abrir',
		'Download',
	],

	allowedActionsforViewAllRequests: [
		'Visualizar',
		'Concluir',
		'Editar',
		'Excluir',
		'Abrir',
	],

	allowedActionsforViewMyRequests: ['Visualizar', 'Editar', 'Excluir'],
	allowedActionsforEditRequest: ['Editar', 'Excluir'],
	allowedActionsforNewRequest: ['Excluir'],
	allowedActionsforViewRequest: ['Editar', 'Excluir', 'Download'],
};

@Injectable({
	providedIn: 'root',
})
export class ActionService {
	constructor() {}

	// Verifica se objeto é instância de RequestInterface (é um objeto de solicitação)
	intanceOfRequest(object: any): object is RequestInterface {
		return 'creation_date' in object;
	}

	// Verifica se objeto é instância de CopyInterface (é um objeto de cópia)
	intanceOfCopy(object: any): object is CopyInterface {
		return 'file_name' in object;
	}

	// Controla se determinadas opções são, ou não, desabilidadas a depender do contexto (tela), ação e elemento a ser modificado
	disabledHandler(
		component?: string,
		state?: string,
		action?: string,
		element?: RequestInterface | CopyInterface
	) {
		switch (state) {
			case 'list-requests':
				// Desabilitar botões de 'Concluir' e 'Editar' caso solicitação tenha data de conclusão (solicitação concluída)
				if (
					this.intanceOfRequest(element) &&
					element.conclusion_date &&
					(action == 'Concluir' || action == 'Editar')
				)
					return true;
				break;

			case 'request-creation':
				// Desabilita tentativas de edição de cópia durante >>criação<< de solicitação
				// É habilitado durante >>edição<< de solicitação
				if (this.intanceOfCopy(element) && action == 'Editar')
					return true;
				break;
		}

		return false;
	}

	callbackHandler(
		component?: string,
		state?: string,
		action?: string,
		element?: RequestInterface | CopyInterface
	) {
		return console.log([state, action, element]);
	}

	hiddenHandler(
		component?: string,
		state?: string,
		action?: string,
		element?: RequestInterface | CopyInterface
	) {
		return false;
	}
}
