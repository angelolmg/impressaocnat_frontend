import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogBoxComponent } from '../components/dialog-box/dialog-box.component';
import { DialogData } from '../models/dialogData.interface';


@Injectable({
	providedIn: 'root',
})
export class DialogService {
	readonly dialog = inject(MatDialog);

	openDialog(data: DialogData): MatDialogRef<DialogBoxComponent> {
		// Remover foco do botão de abrir modal
		// Previnir conflito com aria-hidden='true' no app-root
		const buttonElement = document.activeElement as HTMLElement;
		buttonElement.blur();

    // Abrir modal
		return this.dialog.open(DialogBoxComponent, {
			data: data,
		});
	}
}
