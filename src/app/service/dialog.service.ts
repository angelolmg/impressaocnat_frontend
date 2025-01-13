import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../models/dialogData.interface';

@Injectable({
	providedIn: 'root',
})
export class DialogService {
	readonly dialog = inject(MatDialog);
	
	openDialog(dialogBoxComponent: any, data?: DialogData): MatDialogRef<any> {
		
		// Remover foco do botão de abrir modal
		// Previnir conflito com aria-hidden='true' no app-root
		const buttonElement = document.activeElement as HTMLElement;
		buttonElement.blur();

		return this.dialog.open(dialogBoxComponent, {
			data: data,
		});
	}
}
