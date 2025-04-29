import { Pipe, PipeTransform } from '@angular/core';
import { ActionType } from '../service/action.service';

/**
 * Pipe para converter um tipo de ação (ActionType) em um nome de ícone do Material Icons (string).
 */
@Pipe({
	name: 'icon',
})
export class IconPipe implements PipeTransform {
	transform(action: ActionType): string {
		switch (action) {
			case ActionType.VISUALIZAR:
				return 'visibility';
			case ActionType.FECHAR:
				return 'check_box_outline_blank';
			case ActionType.ABRIR:
				return 'check_box';
			case ActionType.EXCLUIR:
				return 'delete';
			case ActionType.EDITAR:
				return 'edit';
			case ActionType.BAIXAR:
				return 'open_in_new';
			case ActionType.CONFIGURACOES:
				return 'settings';
			default:
				return 'question_mark';
		}
	}
}
