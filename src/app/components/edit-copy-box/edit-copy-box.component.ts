import { Component, inject, model, ModelSignal, OnInit } from '@angular/core';
import {
	FormControl,
	FormGroup,
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { CopyInterface } from '../../models/copy.interface';
import { DialogData } from '../../models/dialogData.interface';
import { MyErrorStateMatcher } from '../../pages/request-form/request-form.component';
import { RequestService } from '../../service/request.service';
import { pageRangeValidator } from '../new-copy-box/new-copy-box.component';

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
		MatStepperModule,
		MatExpansionModule,
		MatSelectModule,
		MatCheckboxModule,
	],
	templateUrl: './edit-copy-box.component.html',
	styleUrl: './edit-copy-box.component.scss',
})
export class EditCopyBoxComponent implements OnInit {
	readonly dialogRef = inject(MatDialogRef<EditCopyBoxComponent>);
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);
	requestService = inject(RequestService);
	matcher = new MyErrorStateMatcher();

	copy!: CopyInterface;
	configForm: FormGroup = new FormGroup({});
	formGroup: ModelSignal<FormGroup> = model(this.configForm);

	ngOnInit(): void {
		this.copy = this.data.data as CopyInterface;

		if (this.copy) {
			this.configForm.addControl(
				'copyCount',
				new FormControl<number | null>(
					this.copy.printConfig.copyCount,
					[Validators.required, Validators.min(1)]
				)
			);

			this.configForm.addControl(
				'pages',
				new FormControl<'Todas' | 'Personalizado'>(
					this.copy.printConfig.pages,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				)
			);

			this.configForm.addControl(
				'pageIntervals',
				new FormControl<string | null>({
					value: this.copy.printConfig.pageIntervals || null,
					disabled: this.copy.printConfig.pages !== 'Personalizado',
				})
			);

			this.configForm.addControl(
				'pagesPerSheet',
				new FormControl<number>(this.copy.printConfig.pagesPerSheet, {
					nonNullable: true,
					validators: [Validators.required, Validators.min(1)],
				})
			);

			this.configForm.addControl(
				'layout',
				new FormControl<'Retrato' | 'Paisagem'>(
					this.copy.printConfig.layout,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				)
			);

			this.configForm.addControl(
				'frontAndBack',
				new FormControl<boolean>(this.copy.printConfig.frontAndBack, {
					nonNullable: true,
					validators: [Validators.required],
				})
			);

			this.configForm.addControl(
				'sheetsTotal',
				new FormControl<number>(this.copy.printConfig.sheetsTotal, {
					nonNullable: true,
					validators: [Validators.required, Validators.min(1)],
				})
			);

			this.configForm.addControl(
				'notes',
				new FormControl<string>(this.copy.notes || '')
			);

			this.formGroup.set(this.configForm);
			this.configForm.valueChanges.subscribe(() => {
				this.updateSheetsTotal();
			});
		}

		// Inicializar validador de intervalo caso seja edição de páginas que já sejam personalizadas
		// Sem esperar valueChanges
		if (this.configForm.get('pages')?.value == 'Personalizado') {
			this.configForm
				.get('pageIntervals')
				?.setValidators([
					Validators.required,
					pageRangeValidator(this.copy.pageCount),
				]);
		}

		// Alterar necessidade de validador de intervalo caso tipo de página seja alterada
		// 'Todas' vs 'Personalizado'
		this.configForm.get('pages')?.valueChanges.subscribe((value) => {
			const pageIntervalsControl = this.configForm.get('pageIntervals');
			const totalPages = this.copy.pageCount;
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

	onNoClick(): void {
		this.dialogRef.close();
	}

	updateSheetsTotal() {
		const shouldPrintAllPages: boolean =
			this.configForm.get('pages')?.value === 'Todas';

		const totalPages = shouldPrintAllPages
			? this.copy.pageCount
			: this.requestService.calcPagesByInterval(
					this.configForm.get('pageIntervals')?.value
			  );

		const copyCount = this.configForm.get('copyCount')?.value;
		const frontAndBack = this.configForm.get('frontAndBack')?.value;
		const pagesPerSheet = this.configForm.get('pagesPerSheet')?.value;

		var subtotal = Math.ceil(
			(totalPages * copyCount) / ((frontAndBack ? 2 : 1) * pagesPerSheet)
		);

		// 'emitEvent: false' para evitar loop infinito com ativação do valueChanges
		this.configForm.patchValue(
			{ sheetsTotal: subtotal },
			{ onlySelf: true, emitEvent: false }
		);
	}

	editedCopy() {
		if (this.configForm.invalid) return null;
		return this.formGroup;
	}

	get notesControl(): FormControl<string> {
		return this.configForm.get('notes') as FormControl;
	}

	configValid(): boolean {
		const pages = this.configForm.get('pages');
		const intervals = this.configForm.get('pageIntervals');

		let emptyIntervalValid = pages?.value === 'Todas' && !intervals?.value;
		let filledIntervalValid =
			pages?.value === 'Personalizado' &&
			intervals?.value &&
			intervals?.valid;

		return (
			this.configForm?.valid &&
			(this.copy.isPhysicalFile ||
				emptyIntervalValid ||
				filledIntervalValid)
		);
	}

	// Helper method to get user-friendly error messages
	getPageIntervalsErrorMessage(): string {
		const control = this.configForm.get('pageIntervals');

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
			return `As páginas devem estar entre 1 e ${this.copy.pageCount}`;
		}

		return '';
	}

	goToNext(stepper: MatStepper) {
		stepper.next();
	}

	goToPrevious(stepper: MatStepper) {
		stepper.previous();
	}
}
