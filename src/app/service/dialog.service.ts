import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogBoxComponent } from '../components/dialog-box/dialog-box.component';


export interface DialogData {
	animal: string;
	name: string;
}

@Injectable({
  providedIn: 'root'
})

export class DialogService {
  readonly dialog = inject(MatDialog);

  openDialog(data: DialogData): MatDialogRef<DialogBoxComponent> {
      return this.dialog.open(DialogBoxComponent, {
        data: data,
      });
    }
}
