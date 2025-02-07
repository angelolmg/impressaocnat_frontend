import { Component, inject, model } from '@angular/core';
import {
	FormControl,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';

@Component({
	selector: 'app-add-copy',
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
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
	],
	templateUrl: './add-copy-box.component.html',
	styleUrl: './add-copy-box.component.scss',
})
export class AddCopyBoxComponent {
	readonly dialogRef = inject(MatDialogRef<AddCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	matcher = new MyErrorStateMatcher();
	selectedFile: any = null;
	_snackBar = inject(MatSnackBar);

	copyNumFormControl = new FormControl('5', [
		Validators.required,
		Validators.min(1),
	]);

	readonly newCopyData = model({
		file: this.selectedFile,
		control: this.copyNumFormControl,
	});

	readonly maxFileSize = environment.MAX_FILE_SIZE_MB;

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;

		if (this.selectedFile) {
			// Check if a file was actually selected
			const fileSizeInMB = this.selectedFile.size / (1024 * 1024); // Convert to MB

			if (fileSizeInMB > this.maxFileSize) {
				let msg = `Tamanho do arquivo excede o tamanho máximo permitido (${this.maxFileSize} MB)`;
				this._snackBar.open(msg, 'Ok');
				console.error(msg);

				this.selectedFile = null; // Clear the selected file
				event.target.value = ''; // Clear the file input field
				return;
			}

			this.newCopyData.set({
				file: this.selectedFile,
				control: this.copyNumFormControl,
			});
		}
	}

	onNoClick(): void {
		this.dialogRef.close();
	}
}
