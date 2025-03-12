import { Component, inject } from '@angular/core';
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
import { CopyInterface, PrintConfig } from '../../models/copy.interface';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';
import { RequestService } from '../../service/request.service';

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
	readonly dialogRef = inject(MatDialogRef<NewCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);

	matcher = new MyErrorStateMatcher();

	baseCopyForm: any = {
		file: null,
		fileName: '',
		isPhysicalFile: false,
		pageCount: 0,
		fileType: null,
		notes: '',

		printConfig: {
			copyCount: null,
			pages: 'Todas',
			pageIntervals: '',
			pagesPerSheet: 1,
			layout: 'Retrato',
			frontAndBack: false,
		},
	};

	newCopyForm!: FormGroup;

	get firstStepForm(): FormGroup {
		return this.newCopyForm.get('firstStepForm') as FormGroup;
	}

	get secondStepForm(): FormGroup {
		return this.newCopyForm.get('secondStepForm') as FormGroup;
	}

	get notesControl(): FormControl<string> {
		return this.newCopyForm.get('notes') as FormControl;
	}

	get sheetsTotal(): number {
		const shouldPrintAllPages: boolean =
			this.secondStepForm.get('pages')?.value === 'Todas';

		const totalPages = shouldPrintAllPages
			? this.firstStepForm.get('pageCount')?.value
			: this.requestService.calcPagesByInterval(
					this.secondStepForm.get('pageIntervals')?.value
			  );
		const copyCount = this.secondStepForm.get('copyCount')?.value;
		const frontAndBack = this.secondStepForm.get('frontAndBack')?.value;
		const pagesPerSheet = this.secondStepForm.get('pagesPerSheet')?.value;

		var subtotal = Math.ceil(
			(totalPages * copyCount) / ((frontAndBack ? 2 : 1) * pagesPerSheet)
		);
		this.newCopyForm.get('sheetsTotal')?.setValue(subtotal);
		return subtotal;
	}

	ngOnInit(): void {
		let copyData = this.data.data as CopyInterface;
		if (copyData) this.baseCopyForm = copyData;

		this.newCopyForm = new FormGroup({
			firstStepForm: new FormGroup({
				file: new FormControl<File | null>(this.baseCopyForm.file),
				fileName: new FormControl<string>(this.baseCopyForm.fileName, [
					Validators.required,
					Validators.maxLength(255),
					Validators.pattern(/^(?!\s*$)[^\\/:*?"<>|,]*$/),
				]),
				isPhysicalFile: new FormControl<boolean>(
					this.baseCopyForm.isPhysicalFile
				),
				pageCount: new FormControl<number>(
					this.baseCopyForm.pageCount,
					[Validators.required, Validators.min(1)]
				),
			}),

			secondStepForm: new FormGroup({
				copyCount: new FormControl<number | null>(
					this.baseCopyForm.printConfig.copyCount,
					[Validators.required, Validators.min(1)]
				),
				pages: new FormControl<'Todas' | 'Personalizado'>(
					this.baseCopyForm.printConfig.pages,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
				pageIntervals: new FormControl<string | null>({
					value: this.baseCopyForm.printConfig.pageIntervals,
					disabled: this.baseCopyForm.printConfig.pageIntervals
						? false
						: true,
				}),
				pagesPerSheet: new FormControl<number>(
					this.baseCopyForm.printConfig.pagesPerSheet,
					{
						nonNullable: true,
						validators: [Validators.required, Validators.min(1)],
					}
				),
				layout: new FormControl<'Retrato' | 'Paisagem'>(
					this.baseCopyForm.printConfig.layout,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
				frontAndBack: new FormControl<boolean>(
					this.baseCopyForm.printConfig.frontAndBack,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
			}),
			sheetsTotal: new FormControl<number>(
				this.baseCopyForm.printConfig.sheetsTotal,
				{
					nonNullable: true,
					validators: [Validators.required, Validators.min(1)],
				}
			),
			notes: new FormControl<string>(this.baseCopyForm.notes),
		});

		this.secondStepForm.get('pages')?.valueChanges.subscribe((value) => {
			const pageIntervalsControl =
				this.secondStepForm.get('pageIntervals');
			const totalPages = this.firstStepForm.get('pageCount')?.value;
			const validators = [
				Validators.required,
				pageRangeValidator(totalPages),
			];

			if (value === 'Personalizado') {
				pageIntervalsControl?.enable();
				pageIntervalsControl?.setValidators(validators);
			} else {
				pageIntervalsControl?.disable();
				pageIntervalsControl?.setValue(null);
				pageIntervalsControl?.removeValidators(validators);
			}

			pageIntervalsControl?.updateValueAndValidity();
		});
	}

	onFileSelected(event: any): void {
		const selectedFile = event.target.files[0] ?? null;
		const fileInput = event.currentTarget as HTMLInputElement;

		if (this.firstStepForm.get('isPhysicalFile')?.value) {
			let msg = `Não é possivel selecionar arquivo. Desmarque a opção de arquivo físico.`;
			this._snackBar.open(msg, 'Ok');
			console.error(msg);
			return;
		}

		if (selectedFile) {
			// Checar se o arquivo foi realmente selecionado
			const fileSizeInMB = selectedFile.size / (1024 * 1024); // Converter para MB
			const fileName = selectedFile.name;

			// Regex para validar o nome do arquivo
			const fileNameRegex = /^(?!\s*$)[^\\/:*?"<>|,]*$/;

			if (fileSizeInMB > this.maxFileSize) {
				let msg = `Erro: Tamanho do arquivo excede o tamanho máximo permitido (${this.maxFileSize} MB)`;
				console.error(msg);
				fileInput.value = '';
				this._snackBar.open(msg, 'Ok');
				return;
			}

			if (!fileNameRegex.test(fileName)) {
				let msg = `Erro: Nome do arquivo contém símbolos não permitidos (\\/:*?"<>|,)`;
				console.error(msg);
				fileInput.value = '';
				this._snackBar.open(msg, 'Ok');
				return;
			}

			this.getPageCount(selectedFile).subscribe({
				next: (fileProfile: FileProfile) => {
					this.firstStepForm
						.get('pageCount')
						?.setValue(fileProfile.pageCount);
					this.firstStepForm
						.get('fileName')
						?.setValue(fileProfile.fileName);
					this.firstStepForm.get('file')?.setValue(selectedFile);
				},
				error: () => {
					fileInput.value = '';
				},
			});
		}
	}

	// Helper method to get user-friendly error messages
	getPageIntervalsErrorMessage(): string {
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
				this.firstStepForm.get('pageCount')?.value
			}`;
		}

		return '';
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
							let encryptErrMsg =
								'PDF encriptado. \
								Porfavor, tente "Abrir o arquivo > Selecionar a opção Imprimir > Selecionar Salvar como PDF > Clicar em Salvar" \
								e anexe o novo arquivo gerado';
							console.error(
								'Erro ao obter número de páginas: ' +
									encryptErrMsg,
								error
							);
							this._snackBar.open(
								'Erro: ' + encryptErrMsg,
								'Ok',
								{
									duration: 18000,
								}
							);
							observer.error(error);
						});
				} else {
					let corruptErrMsg =
						'Erro: Não foi possivel ler o arquivo. PDF potencialmente corrompido';
					console.error(corruptErrMsg);
					this._snackBar.open(corruptErrMsg, 'Ok');
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
		const copyCountControl = this.secondStepForm.get('copyCount');
		const isPhysicalFile = this.firstStepForm.get('isPhysicalFile');
		const pages = this.secondStepForm.get('pages');
		const intervals = this.secondStepForm.get('pageIntervals');

		return (
			copyCountControl?.valid &&
			(isPhysicalFile?.value ||
				(pages?.value === 'Todas' && !intervals?.value) ||
				(pages?.value === 'Personalizado' &&
					intervals?.value &&
					intervals?.valid))
		);
	}
	// TODO: mandar o newCopyForm inteiro e decidir o que fazer com ele do outro lado
	// Assim consigo verificar quais opções avançadas foram de fato mexidas
	requestInfo(): CopyInterface | null {
		if (this.newCopyForm.invalid) return null;

		var printConfig: PrintConfig = {
			copyCount: this.secondStepForm.get('copyCount')?.value,
			pages: this.secondStepForm.get('pages')?.value,
			pageIntervals: this.secondStepForm.get('pageIntervals')?.value,
			pagesPerSheet: this.secondStepForm.get('pagesPerSheet')?.value,
			layout: this.secondStepForm.get('layout')?.value,
			sheetsTotal: this.newCopyForm.get('sheetsTotal')?.value || 0,
			frontAndBack: this.secondStepForm.get('frontAndBack')?.value,
		};

		// Se é arquivo físico, inicializar um arquivo vazio com o nome sendo o rótulo fornecido
		// Caso contrário, manter o nome usual
		var isPhysicalFile: boolean =
			this.firstStepForm.get('isPhysicalFile')?.value;
		var file: File = isPhysicalFile
			? new File([], this.firstStepForm.get('fileName')?.value)
			: (this.firstStepForm.get('file')?.value as File);
		var fileType = file.size > 0 ? file.type : 'Arquivo Físico';

		var newCopyData: CopyInterface = {
			file: file,
			fileName: this.firstStepForm.get('fileName')?.value,
			fileType: fileType,
			pageCount: this.firstStepForm.get('pageCount')?.value,
			printConfig: printConfig,
			isPhysicalFile: isPhysicalFile,
			notes: this.newCopyForm.get('notes')?.value || '',
		};

		return newCopyData;
	}

	goToNext(stepper: MatStepper) {
		stepper.next();
	}

	goToPrevious(stepper: MatStepper) {
		stepper.previous();
	}

	onNoClick(): void {
		this.dialogRef.close();
	}
}
