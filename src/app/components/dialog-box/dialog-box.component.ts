import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogModule,
	MatDialogRef,
	MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogData } from '../../models/dialogData.interface';

@Component({
	selector: 'app-dialog-box',
	imports: [
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
	],
	templateUrl: './dialog-box.component.html',
	styleUrl: './dialog-box.component.scss',
})
export class DialogBoxComponent {
	readonly dialogRef = inject(MatDialogRef<DialogBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);

	onNoClick(): void {
		this.dialogRef.close();
	}
}
