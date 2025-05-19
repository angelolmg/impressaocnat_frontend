import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import {
	DialogDataInput,
	DialogDataResponse,
} from '../../models/dialogData.interface';

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
		MatCheckboxModule,
		ReactiveFormsModule,
	],
	templateUrl: './dialog-box.component.html',
	styleUrl: './dialog-box.component.scss',
})
export class DialogBoxComponent {
	readonly dialogRef = inject(MatDialogRef<DialogBoxComponent>);
	readonly data = inject<DialogDataInput>(MAT_DIALOG_DATA);
	sendNotification = new FormControl<boolean>(false, { nonNullable: true });

	onNoClick(): void {
		this.dialogRef.close();
	}

	confirm(value: boolean): DialogDataResponse {
		return {
			confirmation: value,
			sendNotification: this.sendNotification.value,
		};
	}
}
