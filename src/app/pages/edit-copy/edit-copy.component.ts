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
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../request-form/request-form.component';
import { CopyInterface } from '../../models/copy.interface';

@Component({
	selector: 'app-edit-copy',
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
	templateUrl: './edit-copy.component.html',
	styleUrl: './edit-copy.component.scss',
})
export class EditCopyComponent {
	readonly dialogRef = inject(MatDialogRef<EditCopyComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	

	copy = this.data.data as CopyInterface;

	copyNumFormControl = new FormControl(this.copy.copy_count, [
		Validators.required,
		Validators.min(1),
	]);
		
	readonly formControl = model(this.copyNumFormControl);

	onNoClick(): void {
		this.dialogRef.close();
	}

	matcher = new MyErrorStateMatcher();


}
