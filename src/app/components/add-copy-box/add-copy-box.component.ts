import {
	Component,
	inject,
	signal,
	WritableSignal
} from '@angular/core';
import {
	FormControl,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';

interface CopyFormData {
	file: WritableSignal<any>;
	isPhysical: WritableSignal<boolean>;
	pageNumControl: WritableSignal<FormControl | null>;
	copyNumControl: WritableSignal<FormControl | null>;
}

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
		MatCheckboxModule,
		MatTooltipModule,
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

	copyNumFormControl = new FormControl(5, [
		Validators.required,
		Validators.min(1),
	]);

	pageNumFormControl = new FormControl(1, [
		Validators.required,
		Validators.min(1),
	]);

	newCopyData: CopyFormData = {
		file: signal(null),
		isPhysical: signal(false),
		pageNumControl: signal(null),
		copyNumControl: signal(null),
	};

	readonly maxFileSize = environment.MAX_FILE_SIZE_MB;

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
}
