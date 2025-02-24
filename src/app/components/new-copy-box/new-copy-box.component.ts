import { Component, inject, signal, WritableSignal } from '@angular/core';
import {
	MatDialogRef,
	MAT_DIALOG_DATA,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogModule,
	MatDialogTitle,
} from '@angular/material/dialog';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';
import { AddCopyBoxComponent } from '../add-copy-box/add-copy-box.component';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {
	FormBuilder,
	FormControl,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export interface CopyFormData {
	file: WritableSignal<any>;
	isPhysical: WritableSignal<boolean>;
	pageNumControl: WritableSignal<FormControl>;
	copyNumControl: WritableSignal<FormControl>;
}

@Component({
	selector: 'app-new-copy-box',
	imports: [
		MatStepperModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		MatCheckboxModule,
		MatTooltipModule,
		MatExpansionModule,
		MatIconModule,
		MatSelectModule,
		MatInputModule,
		MatFormFieldModule,
	],
	templateUrl: './new-copy-box.component.html',
	styleUrl: './new-copy-box.component.scss',
})
export class NewCopyBoxComponent {
	readonly dialogRef = inject(MatDialogRef<AddCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	matcher = new MyErrorStateMatcher();
	readonly panelOpenState = signal(false);
	selectedFile: any = null;
	_snackBar = inject(MatSnackBar);

	copyNumFormControl = new FormControl(null, [
		Validators.required,
		Validators.min(1),
	]);

	pageNumFormControl = new FormControl(null, [
		Validators.required,
		Validators.min(1),
	]);

	readonly maxFileSize = environment.MAX_FILE_SIZE_MB;

	newCopyData: CopyFormData = {
		file: signal(null),
		isPhysical: signal(false),
		pageNumControl: signal(this.pageNumFormControl),
		copyNumControl: signal(this.copyNumFormControl),
	};

	private _formBuilder = inject(FormBuilder);

	firstFormGroup = this._formBuilder.group({
		firstCtrl: ['', Validators.required],
	});

	secondFormGroup = this._formBuilder.group({
		pages: ['Todas', Validators.required],
		pageRange: [{value: null, disabled: true}],
        pagesForSheet: [1, Validators.required],
        pagesLayout: ['Retrato', Validators.required],
		frontAndBack: [false, Validators.required],
	});

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;

		if (this.newCopyData.isPhysical()) {
			let msg = `Não é possivel selecionar arquivo. Desmarque a opção de arquivo físico.`;
			this._snackBar.open(msg, 'Ok');
			console.error(msg);
			return;
		}

		if (this.selectedFile) {
			// Checar se o arquivo foi realmente selecionado
			const fileSizeInMB = this.selectedFile.size / (1024 * 1024); // Convert to MB

			if (fileSizeInMB > this.maxFileSize) {
				let msg = `Tamanho do arquivo excede o tamanho máximo permitido (${this.maxFileSize} MB)`;
				this._snackBar.open(msg, 'Ok');
				console.error(msg);

				this.selectedFile = null; // Limpar arquivo selecionado
				event.target.value = ''; // Limpar o campo de input de arquivo
				return;
			}

			this.newCopyData.file.set(this.selectedFile);
		}
	}

	onPageNumChange() {
		this.newCopyData.pageNumControl.set(this.pageNumFormControl);
	}

	onCopyNumChange() {
		this.newCopyData.copyNumControl.set(this.copyNumFormControl);
	}

	onNoClick(): void {
		this.dialogRef.close();
	}

	isPhysical(checked: boolean) {
		this.newCopyData.isPhysical.set(checked);
	}

	goBack(stepper: MatStepper) {
		stepper.previous();
	}

	goForward(stepper: MatStepper) {
		stepper.next();
	}
    pageRangeDefine(val: any) {
        if(val === "Personalizado") {
            this.secondFormGroup.get('pageRange')?.enable()
        } else this.secondFormGroup.get('pageRange')?.disable()
        
    }
}
