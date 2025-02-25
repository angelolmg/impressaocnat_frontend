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
	AbstractControl,
	FormBuilder,
	FormControl,
	FormsModule,
	ReactiveFormsModule,
	ValidationErrors,
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
import { PDFDocument } from 'pdf-lib';
import { Observable } from 'rxjs';

export interface PrintConfig {
	copyNumControl: WritableSignal<FormControl>;
	pageInterval: WritableSignal<FormControl>;
	pageRange: WritableSignal<FormControl>;
	pagesPerSheet: WritableSignal<FormControl>;
	layout: WritableSignal<FormControl>;
	frontAndBack: WritableSignal<FormControl>;
}

export interface CopyFormData {
	file: WritableSignal<any>;
	fileName: WritableSignal<FormControl>;
	isPhysical: WritableSignal<boolean>;
	pageNumControl: WritableSignal<FormControl>;
	printConfig: PrintConfig;
	notes: WritableSignal<FormControl>;
}

interface FileProfile {
	pageCount: number;
	fileName: string;
}

// Custom validator for page range format
export function pageRangeValidator(
	totalPages: number
): (control: AbstractControl) => ValidationErrors | null {
	return (control: AbstractControl): ValidationErrors | null => {
		if (!control.value) {
			return null; // Return null if empty (required validator will catch this if needed)
		}

		// Regex for page ranges format: single numbers or ranges (e.g., "1-5, 8, 11-13")
		// Allows spaces around commas and hyphens
		const regex = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;

		// Check format first
		if (!regex.test(control.value)) {
			return { invalidFormat: true };
		}

		// Check range validity and bounds
		const ranges = control.value.split(',');
		for (const range of ranges) {
			const parts = range.trim().split('-');

			if (parts.length === 2) {
				// Range like "1-5"
				const start = parseInt(parts[0], 10);
				const end = parseInt(parts[1], 10);

				if (start >= end) {
					return { invalidRange: true };
				}

				if (start < 1 || end > totalPages) {
					return { outOfBounds: true };
				}
			} else {
				// Single page like "8"
				const page = parseInt(parts[0], 10);

				if (page < 1 || page > totalPages) {
					return { outOfBounds: true };
				}
			}
		}

		return null;
	};
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
	readonly maxFileSize = environment.MAX_FILE_SIZE_MB;
	readonly dialogRef = inject(MatDialogRef<AddCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	matcher = new MyErrorStateMatcher();
	selectedFile: any = null;
	_snackBar = inject(MatSnackBar);

	// copyNumFormControl = new FormControl(null, [
	// 	Validators.required,
	// 	Validators.min(1),
	// ]);

	// pageNumFormControl = new FormControl(null, [
	// 	Validators.required,
	// 	Validators.min(1),
	// ]);

	printConfig: PrintConfig = {
		copyNumControl: signal(
			new FormControl(null, [Validators.required, Validators.min(1)])
		),
		pageInterval: signal(new FormControl('Todas', [Validators.required])),
		pageRange: signal(new FormControl({ value: null, disabled: true })),
		pagesPerSheet: signal(
			new FormControl(1, [Validators.required, Validators.min(1)])
		),
		layout: signal(new FormControl('Retrato', [Validators.required])),
		frontAndBack: signal(new FormControl(false, [Validators.required])),
	};

	newCopyData: CopyFormData = {
		file: signal(null),
		fileName: signal(
			new FormControl(null, [
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(255),
				Validators.pattern(/^(?!\s*$)[^\\/:*?"<>|]*$/),
			])
		),
		isPhysical: signal(false),
		pageNumControl: signal(
			new FormControl(null, [Validators.required, Validators.min(1)])
		),
		printConfig: this.printConfig,
		notes: signal(new FormControl(null)),
	};

	// private _formBuilder = inject(FormBuilder);

	// firstFormGroup = this._formBuilder.group({
	// 	firstCtrl: ['', Validators.required],
	// });

	// secondFormGroup = this._formBuilder.group({
	// 	pages: ['Todas', Validators.required],
	// 	pageRange: [
	// 		{ value: null, disabled: true },
	// 		[Validators.required, pageRangeValidator()],
	// 	],
	// 	pagesForSheet: [1, Validators.required],
	// 	pagesLayout: ['Retrato', Validators.required],
	// 	frontAndBack: [false, Validators.required],
	// });

	logme(event: any) {
		console.log(event);
		console.log(this.newCopyData.fileName());
	}

	ngOnInit(): void {
		// Enable/disable pageRange based on the pages selection
		// this.secondFormGroup.get('pages')?.valueChanges.subscribe((value) => {
		// 	const pageRangeControl = this.secondFormGroup.get('pageRange');

		// 	if (value === 'Personalizado') {
		// 		pageRangeControl?.enable();
		// 	} else {
		// 		pageRangeControl?.disable();
		// 		pageRangeControl?.setValue(null);
		// 	}
		// });

		this.newCopyData.printConfig
			.pageInterval()
			.valueChanges.subscribe((value) => {
				const pageRangeControl =
					this.newCopyData.printConfig.pageRange();
				const totalPages = this.newCopyData.pageNumControl().value;

				if (value === 'Personalizado') {
					pageRangeControl?.enable();
				} else {
					pageRangeControl?.disable();
					pageRangeControl?.setValue(null);
				}

				pageRangeControl.setValidators([
					pageRangeValidator(totalPages),
				]);
				pageRangeControl.updateValueAndValidity();
			});

		// If total pages might change, you'll need to update the validator
		// this.newCopyData
		// 	.pageNumControl()
		// 	.valueChanges.subscribe((totalPages) => {
		// 		const pageRangeControl =
		// 			this.newCopyData.printConfig.pageRange();
		// 		pageRangeControl.setValidators([
		// 			Validators.required,
		// 			pageRangeValidator(totalPages),
		// 		]);
		// 		pageRangeControl.updateValueAndValidity();
		// 	});
	}

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

			this.getPageCount(this.selectedFile).subscribe({
				next: (fileProfile: FileProfile) => {
					this.newCopyData
						.pageNumControl()
						.setValue(fileProfile.pageCount);
					this.newCopyData.fileName().setValue(fileProfile.fileName);
					this.newCopyData.file.set(this.selectedFile);
				},
				error: (error) => {
					console.error('Erro ao obter número de páginas:', error);
					this._snackBar.open(
						'Erro ao obter número de páginas do PDF',
						'Ok'
					);
				},
			});
		}
	}

	// Helper method to get user-friendly error messages
	getPageRangeErrorMessage(): string {
		const control = this.newCopyData.printConfig.pageRange();

		if (control?.hasError('required')) {
			return 'O intervalo de páginas é obrigatório';
		}

		if (control?.hasError('invalidFormat')) {
			return 'Formato inválido. Use o formato: 1-5, 8, 11-13';
		}

		if (control?.hasError('invalidRange')) {
			return 'O primeiro número deve ser menor que o segundo';
		}

		if (control.hasError('outOfBounds')) {
			return `As páginas devem estar entre 1 e ${
				this.newCopyData.pageNumControl().value
			}`;
		}

		return '';
	}

	// onPageNumChange() {
	// 	this.newCopyData.pageNumControl.set(this.pageNumFormControl);
	// }

	// onCopyNumChange() {
	// 	this.newCopyData.copyNumControl.set(this.copyNumFormControl);
	// }

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

	getPageCount(file: File): Observable<FileProfile> {
		return new Observable<FileProfile>((observer) => {
			const reader = new FileReader();
			reader.readAsArrayBuffer(file);
			reader.onloadend = () => {
				if (reader.result) {
					PDFDocument.load(reader.result)
						.then((document) => {
							observer.next({
								pageCount: document.getPageCount() ?? 0,
								fileName: file.name,
							});
							observer.complete();
						})
						.catch((error) => {
							console.error('Erro ao carregar PDF:', error);
							observer.error(error);
						});
				} else {
					console.error('Não foi possível ler arquivo');
					observer.error('Não foi possível ler arquivo');
				}
			};
		});
	}

	// Retorna se o primeiro passo é válido
	// As informações que importão aqui são o nome/rótulo e número de páginas do arquivo
	fistStepValid(): boolean {
		return (
			this.newCopyData.fileName().valid &&
			this.newCopyData.pageNumControl().valid
		);
	}

	secondStepValid(): boolean {
		const config = this.newCopyData.printConfig;
		const isPhysical = this.newCopyData.isPhysical();
		const interval = config.pageInterval().value;
		const range = config.pageRange();

		return (
			config.copyNumControl().valid &&
			(isPhysical ||
				(interval === 'Todas' && range.value === null) ||
				(interval === 'Personalizado' &&
					range.value !== null &&
					range.valid))
		);
	}

	// export interface PrintConfig {
	// 	copyNumControl: WritableSignal<FormControl>;
	// 	pageInterval: WritableSignal<FormControl>;
	// 	pageRange: WritableSignal<FormControl>;
	// 	pagesPerSheet: WritableSignal<FormControl>;
	// 	layout: WritableSignal<FormControl>;
	// 	frontAndBack: WritableSignal<FormControl>;
	// }

	// export interface CopyFormData {
	// 	file: WritableSignal<any>;
	// 	fileName: WritableSignal<FormControl>;
	// 	isPhysical: WritableSignal<boolean>;
	// 	pageNumControl: WritableSignal<FormControl>;
	// 	printConfig: PrintConfig;
	// 	notes: WritableSignal<FormControl>;
	// }

	// pageRangeDefine(val: any) {
	// 	if (val === 'Personalizado') {
	// 		this.secondFormGroup.get('pageRange')?.enable();
	// 	} else this.secondFormGroup.get('pageRange')?.disable();
	// }
}
