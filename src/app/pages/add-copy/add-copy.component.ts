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
import { MyErrorStateMatcher } from '../request-form/request-form.component';

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
	templateUrl: './add-copy.component.html',
	styleUrl: './add-copy.component.scss',
})
export class AddCopyComponent {
	readonly dialogRef = inject(MatDialogRef<AddCopyComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	matcher = new MyErrorStateMatcher();
	selectedFile: any = null;

	copyNumFormControl = new FormControl('10', [
		Validators.required,
		Validators.min(1),
	]);

	readonly formControl = model(this.copyNumFormControl);

	onNoClick(): void {
		this.dialogRef.close();
	}

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;
		console.log(this.selectedFile);
	}
}
