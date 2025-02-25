import { Component, inject, signal, WritableSignal } from '@angular/core';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	ValidationErrors,
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PDFDocument } from 'pdf-lib';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';
import { AddCopyBoxComponent } from '../add-copy-box/add-copy-box.component';

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
	_snackBar = inject(MatSnackBar);

	newCopyForm = new FormGroup({
		firstStepForm: new FormGroup({
			file: new FormControl<any>(null),
			fileName: new FormControl<string>('', [
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(255),
				Validators.pattern(/^(?!\s*$)[^\\/:*?"<>|]*$/),
			]),
			isPhysical: new FormControl<boolean>(false),
			pageNum: new FormControl<number>(0, [
				Validators.required,
				Validators.min(1),
			]),
		}),

		secondStepForm: new FormGroup({
			copyNum: new FormControl<number | null>(null, [
				Validators.required,
				Validators.min(1),
			]),
			pages: new FormControl<'Todas' | 'Personalizado'>('Todas', [
				Validators.required,
			]),
			pageIntervals: new FormControl<string>({
				value: '',
				disabled: true,
			}),
			pagesPerSheet: new FormControl<number>(1, [
				Validators.required,
				Validators.min(1),
			]),
			layout: new FormControl<'Retrato' | 'Paisagem'>('Retrato', [
				Validators.required,
			]),
			frontAndBack: new FormControl<boolean>(false, [
				Validators.required,
			]),
		}),

		test: new FormGroup({
			copyNum: new FormControl<number>(0, [
				Validators.required,
				Validators.min(1),
			]),
		}),
	});

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

	logme(event: any) {
		console.log(event);
	}

	get firstStepForm(): FormGroup {
		return this.newCopyForm.get('firstStepForm') as FormGroup;
	}

	get secondStepForm(): FormGroup {
		return this.newCopyForm.get('secondStepForm') as FormGroup;
	}

	ngOnInit(): void {
		this.secondStepForm.get('pages')?.valueChanges.subscribe((value) => {
			const pageRangeControl = this.secondStepForm.get('pageIntervals');
			const totalPages = this.firstStepForm.get('pageNum')?.value;

			if (value === 'Personalizado') {
				pageRangeControl?.enable();
			} else {
				pageRangeControl?.disable();
				pageRangeControl?.setValue(null);
			}

			pageRangeControl?.setValidators([pageRangeValidator(totalPages)]);
			pageRangeControl?.updateValueAndValidity();
		});
	}

	onFileSelected(event: any): void {
		const selectedFile = event.target.files[0] ?? null;

		console.log(selectedFile);
		

		if (this.newCopyData.isPhysical()) {
			let msg = `Não é possivel selecionar arquivo. Desmarque a opção de arquivo físico.`;
			this._snackBar.open(msg, 'Ok');
			console.error(msg);
			return;
		}

		if (selectedFile) {
			// Checar se o arquivo foi realmente selecionado
			const fileSizeInMB = selectedFile.size / (1024 * 1024); // Convert to MB

			if (fileSizeInMB > this.maxFileSize) {
				let msg = `Tamanho do arquivo excede o tamanho máximo permitido (${this.maxFileSize} MB)`;
				this._snackBar.open(msg, 'Ok');
				console.error(msg);
				return;
			}

			this.getPageCount(selectedFile).subscribe({
				next: (fileProfile: FileProfile) => {
					this.firstStepForm
						.get('pageNum')
						?.setValue(fileProfile.pageCount);
					this.firstStepForm
						.get('fileName')
						?.setValue(fileProfile.fileName);
					this.firstStepForm.get('file')?.setValue(selectedFile);
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
		const control = this.secondStepForm.get('pageIntervals');

		if (control?.hasError('required')) {
			return 'O intervalo de páginas é obrigatório';
		}

		if (control?.hasError('invalidFormat')) {
			return 'Formato inválido. Use o formato: 1-5, 8, 11-13';
		}

		if (control?.hasError('invalidRange')) {
			return 'O primeiro número deve ser menor que o segundo';
		}

		if (control?.hasError('outOfBounds')) {
			return `As páginas devem estar entre 1 e ${
				this.firstStepForm.get('pageNum')?.value
			}`;
		}

		return '';
	}

	onNoClick(): void {
		this.dialogRef.close();
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
	fistStepValid(): boolean {
		return this.firstStepForm.valid;
	}

	secondStepValid(): boolean {
		const copyNumControl = this.secondStepForm.get('copyNum');
		const isPhysical = this.firstStepForm.get('isPhysical');
		const pages = this.secondStepForm.get('pages');
		const intervals = this.secondStepForm.get('pageIntervals');

		return (
			copyNumControl?.valid &&
			(isPhysical?.value ||
				(pages?.value === 'Todas' && intervals?.value === "") ||
				(pages?.value === 'Personalizado' &&
					intervals?.value !== "" &&
					intervals?.valid))
		);
	}
}
