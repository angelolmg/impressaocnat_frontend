import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogDataInput } from '../models/dialogData.interface';

/**
 * Serviço para gerenciamento de diálogos (modais) na aplicação.
 */
@Injectable({
	providedIn: 'root',
})
export class DialogService {
	/** Instância do serviço MatDialog para abrir e gerenciar diálogos. */
	readonly dialog = inject(MatDialog);

	/**
     * Abre um diálogo (modal) na aplicação.
     *
     * @param {any} dialogBoxComponent O componente do diálogo a ser aberto.
     * @param {DialogData} [data] Os dados a serem passados para o componente do diálogo.
     * @param {boolean} [disableClose=false] Indica se o diálogo deve ser fechado ao clicar fora dele ou pressionar ESC.
     * @returns {MatDialogRef<any>} Uma referência para o diálogo aberto.
     */
	openDialog(
		dialogBoxComponent: any,
		data?: DialogDataInput,
		disableClose: boolean = false
	): MatDialogRef<any> {

		// Fechar todos os dialogos antes de abrir um novo
		this.dialog.closeAll();

		// Remover foco do botão de abrir modal
		// Previnir conflito com aria-hidden='true' no app-root
		const buttonElement = document.activeElement as HTMLElement;
		buttonElement.blur();

		// Abre o diálogo com as configurações fornecidas.
		return this.dialog.open(dialogBoxComponent, {
			data: data,
			disableClose: disableClose,
		});
	}
}
