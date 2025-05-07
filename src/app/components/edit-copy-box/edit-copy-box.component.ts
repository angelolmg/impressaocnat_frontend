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
import { FormErrorStateMatcher, pageRangeValidator } from '../../configs/validators.config';
import { CopyInterface } from '../../models/copy.interface';
import { DialogDataInput } from '../../models/dialogData.interface';
import { SolicitationService } from '../../service/solicitation.service';

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

/**
 * Caixa de edição de cópias
 * Usuários podem editar configurações de impressão e observações anexas
 */
export class EditCopyBoxComponent implements OnInit {
	/** Referência ao diálogo atual, usada para fechar o diálogo. */
	readonly dialogRef = inject(MatDialogRef<EditCopyBoxComponent>);

	/** Dados passados para o diálogo, contendo a configuração de cópia. */
	readonly data = inject<DialogDataInput>(MAT_DIALOG_DATA);

	/** Serviço de requisições. */
	solicitationService = inject(SolicitationService);

	/** Validador personalizado para estados de erro do formulário. */
	matcher = new FormErrorStateMatcher();

	/** Interface contendo os dados da cópia a ser editada. */
	copy!: CopyInterface;

	/** Formulário de configuração para edição da cópia. */
	configForm: FormGroup = new FormGroup({});

	/** Signal para gerenciar o formulário de configuração. */
	formGroup: ModelSignal<FormGroup> = model(this.configForm);

	ngOnInit(): void {
		// Inicializa a cópia com os dados passados para o diálogo.
		this.copy = this.data.data as CopyInterface;

		if (this.copy) {
			// Adiciona controles ao formulário com os valores e validadores apropriados.
			this.configForm.addControl(
				'copyCount',
				new FormControl<number | null>(
					this.copy.printConfig.copyCount || null,
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

			// Sincroniza o formulário com o signal.
			this.formGroup.set(this.configForm);

			// Observa mudanças no formulário para atualizar o total de folhas.
			this.configForm.valueChanges.subscribe(() => {
				this.updateSheetsTotal();
			});
		}

		// Inicializa validador de intervalo caso seja edição de solicitação onde 'pages' = 'Personalizado'.
		// Sem esperar valueChanges
		if (this.configForm.get('pages')?.value == 'Personalizado') {
			this.configForm
				.get('pageIntervals')
				?.setValidators([
					Validators.required,
					pageRangeValidator(this.copy.pageCount),
				]);
		}

		// Alterar necessidade de validador de intervalo caso tipo de página 'pages' seja alterada.
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

	/**
	 * Retorna o controle de formulário para o campo 'notes' do formulário de configuração.
	 *
	 * @returns {FormControl<string>} O controle de formulário para o campo 'notes'.
	 */
	get notesControl(): FormControl<string> {
		return this.configForm.get('notes') as FormControl<string>;
	}

	/**
	 * Calcula e atualiza o número total de folhas necessárias para a impressão,
	 * com base nas configurações do formulário.
	 *
	 * A função considera se todas as páginas devem ser impressas, o intervalo de páginas,
	 * o número de cópias, a impressão frente e verso e o número de páginas por folha.
	 *
	 * O resultado é armazenado no campo 'sheetsTotal' do formulário de configuração.
	 *
	 * @returns {void}
	 */
	updateSheetsTotal(): void {
		// Determina se todas as páginas devem ser impressas com base no valor do campo 'pages' do formulário.
		const shouldPrintAllPages: boolean =
			this.configForm.get('pages')?.value === 'Todas';

		// Calcula o número total de páginas a serem impressas.
		// Se 'shouldPrintAllPages' for verdadeiro, usa o número total de páginas do documento ('copy.pageCount').
		// Caso contrário, calcula o número de páginas com base no intervalo de páginas especificado no formulário.
		const totalPages = shouldPrintAllPages
			? this.copy.pageCount
			: this.solicitationService.calcPagesByInterval(
					this.configForm.get('pageIntervals')?.value
			  );

		// Obtém os valores dos campos 'copyCount', 'frontAndBack' e 'pagesPerSheet' do formulário.
		const copyCount = this.configForm.get('copyCount')?.value;
		const frontAndBack = this.configForm.get('frontAndBack')?.value;
		const pagesPerSheet = this.configForm.get('pagesPerSheet')?.value;

		// Calcula o subtotal de folhas necessárias.
		// A fórmula leva em consideração o número total de páginas, o número de cópias,
		// a impressão frente e verso (que dobra a capacidade de páginas por folha) e o número de páginas por folha.
		// 'Math.ceil' arredonda o resultado para cima, garantindo que todas as páginas sejam impressas.
		var subtotal = Math.ceil(
			(totalPages * copyCount) / ((frontAndBack ? 2 : 1) * pagesPerSheet)
		);

		// Atualiza o valor do campo 'sheetsTotal' no formulário com o subtotal calculado.
		// 'emitEvent: false' é usado para evitar loops infinitos que podem ocorrer devido a eventos 'valueChanges' associados ao formulário.
		// 'onlySelf: true' garante que a atualização não propague eventos para outros controles do formulário.
		this.configForm.patchValue(
			{ sheetsTotal: subtotal },
			{ onlySelf: true, emitEvent: false }
		);
	}

	/**
	 * Retorna uma mensagem de erro para o campo 'pageIntervals' do formulário.
	 *
	 * A mensagem de erro varia dependendo do tipo de erro encontrado no controle.
	 *
	 * @returns {string} A mensagem de erro correspondente ao erro encontrado, ou uma string vazia se não houver erro.
	 */
	getPageIntervalsErrorMessage(): string {
		// Obtém o controle 'pageIntervals' do formulário.
		const control = this.configForm.get('pageIntervals');

		// Verifica se o controle tem um erro de 'required' (obrigatório).
		if (control?.hasError('required')) {
			return 'O intervalo de páginas é obrigatório';
		}

		// Verifica se o controle tem um erro de 'invalidFormat' (formato inválido).
		if (control?.hasError('invalidFormat')) {
			return 'Formato inválido. Use o formato: 1-5, 8, 11-13';
		}

		// Verifica se o controle tem um erro de 'invalidRange' (intervalo inválido).
		if (control?.hasError('invalidRange')) {
			return 'O primeiro número deve ser menor que o segundo';
		}

		// Verifica se o controle tem um erro de 'outOfBounds' (fora dos limites).
		if (control?.hasError('outOfBounds')) {
			return `As páginas devem estar entre 1 e ${this.copy.pageCount}`;
		}

		// Retorna uma string vazia se nenhum erro for encontrado.
		return '';
	}

	/**
	 * Avança para o próximo passo no MatStepper.
	 *
	 * @param {MatStepper} stepper - A instância do MatStepper a ser manipulada.
	 * @returns {void}
	 */
	goToNext(stepper: MatStepper): void {
		stepper.next();
	}

	/**
	 * Retorna para o passo anterior no MatStepper.
	 *
	 * @param {MatStepper} stepper - A instância do MatStepper a ser manipulada.
	 * @returns {void}
	 */
	goToPrevious(stepper: MatStepper): void {
		stepper.previous();
	}

	/**
	 * Fecha o diálogo atual sem realizar nenhuma ação adicional.
	 *
	 * @returns {void}
	 */
	onNoClick(): void {
		this.dialogRef.close();
	}
}
