import { RequestInterface } from './../models/request.interface';
import { Injectable } from '@angular/core';
import { CopyInterface } from '../models/copy.interface';

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
		context: string,
		action: string,
		element: RequestInterface | CopyInterface
	) {
		switch (context) {
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
				if (this.intanceOfCopy(element) && action == 'Editar') return true;
				break;
		}

		return false;
	}

	callbackHandler(
		context: string,
		action: string,
		element?: RequestInterface | CopyInterface
	) {



		return console.log([context, action, element]);


	}
}
