import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../models/dialogData.interface';

@Injectable({
	providedIn: 'root',
})
export class DialogService {
	readonly dialog = inject(MatDialog);

	openDialog(
		dialogBoxComponent: any,
		data?: DialogData,
		disableClose: boolean = false
	): MatDialogRef<any> {

		// Fechar todos os dialogos antes de abrir um novo
		this.dialog.closeAll();

		// Remover foco do botão de abrir modal
		// Previnir conflito com aria-hidden='true' no app-root
		const buttonElement = document.activeElement as HTMLElement;
		buttonElement.blur();

		return this.dialog.open(dialogBoxComponent, {
			data: data,
			disableClose: disableClose,
		});
	}
}
