import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogBoxComponent } from '../components/dialog-box/dialog-box.component';
import { DialogData } from '../models/dialogData.interface';
import { EditCopyComponent } from '../pages/edit-copy/edit-copy.component';
import { AddCopyComponent } from '../pages/add-copy/add-copy.component';

@Injectable({
	providedIn: 'root',
})
export class DialogService {
	readonly dialog = inject(MatDialog);
	
	openDialog(data: DialogData, dialogBoxComponent: any): MatDialogRef<any> {
		
		// Remover foco do botão de abrir modal
		// Previnir conflito com aria-hidden='true' no app-root
		const buttonElement = document.activeElement as HTMLElement;
		buttonElement.blur();

		return this.dialog.open(dialogBoxComponent, {
			data: data,
		});
	}
}
