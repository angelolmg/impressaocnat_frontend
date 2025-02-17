import { Component, inject, model, ModelSignal, OnInit } from '@angular/core';
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
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';
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
	templateUrl: './edit-copy-box.component.html',
	styleUrl: './edit-copy-box.component.scss',
})
export class EditCopyBoxComponent implements OnInit {
	
	readonly dialogRef = inject(MatDialogRef<EditCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);

	copy!: CopyInterface;
	copyNumFormControl: FormControl = new FormControl(0, [
		Validators.required,
		Validators.min(1),
	]);
	formControl: ModelSignal<FormControl> = model(this.copyNumFormControl);

	matcher = new MyErrorStateMatcher();
	
	ngOnInit(): void {
		this.copy = this.data.data as CopyInterface;

		if(this.copy) {
			this.copyNumFormControl = new FormControl(this.copy.copyCount, [
				Validators.required,
				Validators.min(1),
			]);
				
			this.formControl.set(this.copyNumFormControl);
		}
	}

	onNoClick(): void {
		this.dialogRef.close();
	}
}
