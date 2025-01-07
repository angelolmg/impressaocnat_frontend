import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
	name: 'icon',
})
export class IconPipe implements PipeTransform {
	transform(value: string): string {
		switch (value) {
			case 'Visualizar':
				return 'visibility';
			case 'Concluir':
				return 'check';
            case 'Abrir':
                return 'close';
			case 'Excluir':
				return 'delete';
			case 'Editar':
				return 'edit';
			case 'Download':
				return 'download';
		}
		return 'question_mark';
	}
}
