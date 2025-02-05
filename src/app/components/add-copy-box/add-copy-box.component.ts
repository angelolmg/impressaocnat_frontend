import { Component, inject, model } from '@angular/core';
import {
	FormsModule,
	ReactiveFormsModule,
	FormControl,
	Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
	MatDialogModule,
	MatDialogTitle,
	MatDialogContent,
	MatDialogActions,
	MatDialogClose,
	MatDialogRef,
	MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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

	copyNumFormControl = new FormControl('10', [
		Validators.required,
		Validators.min(1),
	]);

	readonly newCopyData = model({
		file: this.selectedFile,
		control: this.copyNumFormControl,
	});

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;
		this.newCopyData.set({
			file: this.selectedFile,
			control: this.copyNumFormControl,
		});
	}

	onNoClick(): void {
		this.dialogRef.close();
	}
}
