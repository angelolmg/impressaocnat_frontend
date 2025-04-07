import { Component, inject } from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators
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
import { FormErrorStateMatcher, pageRangeValidator } from '../../configs/validators.config';
import { CopyInterface } from '../../models/copy.interface';
import { DialogData, FileProfile } from '../../models/dialogData.interface';
import { RequestService } from '../../service/request.service';
import { PrintConfig } from '../../models/printConfig.interface';

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
	/** Tamanho máximo permitido para arquivos em MB, obtido do ambiente. */
	readonly maxFileSize = environment.MAX_FILE_SIZE_MB;

	/** Referência ao diálogo atual, usada para fechar o diálogo. */
	readonly dialogRef = inject(MatDialogRef<NewCopyBoxComponent>);

	/** Dados passados para o diálogo, contendo a configuração de cópia. */
	readonly data = inject<DialogData>(MAT_DIALOG_DATA);

	/** Serviço para realizar requisições relacionadas a cópias. */
	requestService = inject(RequestService);

	/** Serviço para exibir mensagens de snackbar. */
	_snackBar = inject(MatSnackBar);

	/** Validador personalizado para estados de erro do formulário. */
	matcher = new FormErrorStateMatcher();

	/** Dados base para inicialização do formulário de cópia. */
	baseCopyForm: CopyInterface = {
		file: new File([], ''),
		fileName: '',
		isPhysicalFile: false,
		pageCount: 0,
		fileType: '',
		notes: '',

		printConfig: {
			copyCount: 0,
			pages: 'Todas',
			pageIntervals: '',
			pagesPerSheet: 1,
			layout: 'Retrato',
			frontAndBack: false,
			sheetsTotal: 0
		},
	};

	/** Formulário principal para a criação de nova cópia. */
	newCopyForm!: FormGroup;

	/** Getter para o formulário do primeiro passo. */
	get firstStepForm(): FormGroup {
		return this.newCopyForm.get('firstStepForm') as FormGroup;
	}

	/** Getter para o formulário do segundo passo. */
	get secondStepForm(): FormGroup {
		return this.newCopyForm.get('secondStepForm') as FormGroup;
	}

	/** Getter para o controle de notas do formulário. */
	get notesControl(): FormControl<string> {
		return this.newCopyForm.get('notes') as FormControl;
	}

	/**
	 * Getter para calcular e retornar o total de folhas necessárias para a cópia.
	 *
	 * Este getter calcula o número total de folhas com base nas configurações de impressão,
	 * incluindo o número total de páginas, o número de cópias, a impressão frente e verso
	 * e o número de páginas por folha. Ele também atualiza o valor do campo 'sheetsTotal'
	 * no formulário principal.
	 *
	 * @returns {number} O número total de folhas necessárias para a cópia.
	 */
	get sheetsTotal(): number {
		// Determina se todas as páginas devem ser impressas.
		const shouldPrintAllPages: boolean =
			this.secondStepForm.get('pages')?.value === 'Todas';

		// Calcula o número total de páginas a serem impressas.
		// Se 'shouldPrintAllPages' for verdadeiro, usa o número total de páginas do primeiro passo do formulário.
		// Caso contrário, calcula o número de páginas com base no intervalo de páginas especificado no segundo passo do formulário.
		const totalPages = shouldPrintAllPages
			? this.firstStepForm.get('pageCount')?.value
			: this.requestService.calcPagesByInterval(
					this.secondStepForm.get('pageIntervals')?.value
			  );

		// Obtém os valores dos controles necessários para o cálculo.
		const copyCount = this.secondStepForm.get('copyCount')?.value;
		const frontAndBack = this.secondStepForm.get('frontAndBack')?.value;
		const pagesPerSheet =
			this.secondStepForm.get('pagesPerSheet')?.value || 1;

		// Calcula o subtotal de folhas necessárias.
		// A fórmula leva em consideração o número total de páginas, o número de cópias,
		// a impressão frente e verso (que dobra a capacidade de páginas por folha) e o número de páginas por folha.
		// 'Math.ceil' arredonda o resultado para cima, garantindo que todas as páginas sejam impressas.
		var subtotal = Math.ceil(
			(totalPages * copyCount) / ((frontAndBack ? 2 : 1) * pagesPerSheet)
		);

		// Atualiza o valor do controle 'sheetsTotal' no formulário principal com o subtotal calculado.
		this.newCopyForm.get('sheetsTotal')?.setValue(subtotal);

		// Retorna o subtotal calculado.
		return subtotal;
	}

	ngOnInit(): void {
		// Obtém os dados da cópia passados para o diálogo.
		let copyData = this.data.data as CopyInterface;

		// Se os dados da cópia existirem, usa-os para inicializar o formulário base.
		if (copyData) this.baseCopyForm = copyData;

		// Cria o formulário principal (newCopyForm) com dois subformulários (firstStepForm e secondStepForm)
		// e controles para sheetsTotal e notes.
		this.newCopyForm = new FormGroup({
			// Primeiro passo do formulário, contendo informações sobre o arquivo.
			firstStepForm: new FormGroup({
				// Controle para o arquivo selecionado.
				file: new FormControl<File>(this.baseCopyForm.file),
				// Controle para o nome do arquivo, com validações de obrigatoriedade, tamanho máximo e padrão de nome.
				fileName: new FormControl<string>(this.baseCopyForm.fileName, [
					Validators.required,
					Validators.minLength(3),
					Validators.maxLength(255),
					Validators.pattern(/^(?!\s*$)[^\\/:*?"<>|,]*$/),
				]),
				// Controle para indicar se o arquivo é físico.
				isPhysicalFile: new FormControl<boolean>(
					this.baseCopyForm.isPhysicalFile
				),
				// Controle para o número de páginas do arquivo, com validações de obrigatoriedade e valor mínimo.
				pageCount: new FormControl<number>(
					this.baseCopyForm.pageCount,
					[Validators.required, Validators.min(1)]
				),
			}),

			// Segundo passo do formulário, contendo configurações de impressão.
			secondStepForm: new FormGroup({
				// Controle para o número de cópias, com validações de obrigatoriedade e valor mínimo.
				// Se 'copycount' for '0' setar controle como 'undefined' ao invés de '0', limpando-o
				copyCount: new FormControl<number | undefined>(
					this.baseCopyForm.printConfig.copyCount || undefined,
					[Validators.required, Validators.min(1)]
				),
				// Controle para a seleção de páginas (Todas ou Personalizado), com validação de obrigatoriedade.
				pages: new FormControl<'Todas' | 'Personalizado'>(
					this.baseCopyForm.printConfig.pages,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
				// Controle para o intervalo de páginas, inicialmente desabilitado se não houver intervalo pré-definido.
				pageIntervals: new FormControl<string | undefined>({
					value: this.baseCopyForm.printConfig.pageIntervals,
					disabled: this.baseCopyForm.printConfig.pageIntervals
						? false
						: true,
				}),
				// Controle para o número de páginas por folha, com validações de obrigatoriedade e valor mínimo.
				pagesPerSheet: new FormControl<number>(
					this.baseCopyForm.printConfig.pagesPerSheet,
					{
						nonNullable: true,
						validators: [Validators.required, Validators.min(1)],
					}
				),
				// Controle para o layout da página (Retrato ou Paisagem), com validação de obrigatoriedade.
				layout: new FormControl<'Retrato' | 'Paisagem'>(
					this.baseCopyForm.printConfig.layout,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
				// Controle para a impressão frente e verso, com validação de obrigatoriedade.
				frontAndBack: new FormControl<boolean>(
					this.baseCopyForm.printConfig.frontAndBack,
					{
						nonNullable: true,
						validators: [Validators.required],
					}
				),
			}),
			// Controle para o número total de folhas, com validações de obrigatoriedade e valor mínimo.
			sheetsTotal: new FormControl<number>(
				this.baseCopyForm.printConfig.sheetsTotal,
				{
					nonNullable: true,
					validators: [Validators.required, Validators.min(1)],
				}
			),
			// Controle para notas adicionais, sem validações específicas.
			notes: new FormControl<string>(this.baseCopyForm.notes),
		});

		// Observa mudanças no controle 'pages' para habilitar/desabilitar e validar o controle 'pageIntervals'.
		this.secondStepForm.get('pages')?.valueChanges.subscribe((value) => {
			const pageIntervalsControl =
				this.secondStepForm.get('pageIntervals');
			const totalPages = this.firstStepForm.get('pageCount')?.value;
			const validators = [
				Validators.required,
				pageRangeValidator(totalPages),
			];

			// Se a seleção de páginas for 'Personalizado', habilita e valida o controle 'pageIntervals'.
			if (value === 'Personalizado') {
				pageIntervalsControl?.enable();
				pageIntervalsControl?.setValidators(validators);
			} else {
				// Se a seleção de páginas for 'Todas', desabilita, limpa e remove as validações do controle 'pageIntervals'.
				pageIntervalsControl?.disable();
				pageIntervalsControl?.setValue(null);
				pageIntervalsControl?.removeValidators(validators);
			}

			// Atualiza o valor e a validade do controle 'pageIntervals'.
			pageIntervalsControl?.updateValueAndValidity();
		});
	}

	/**
	 * Manipula a seleção de um arquivo, validando o tamanho e o nome do arquivo,
	 * e atualizando o formulário com as informações do arquivo.
	 *
	 * A função verifica se a opção de arquivo físico está desmarcada,
	 * valida o tamanho e o nome do arquivo, e obtém a contagem de páginas do arquivo.
	 *
	 * @param {any} event - O evento de seleção de arquivo.
	 * @returns {void}
	 */
	onFileSelected(event: any): void {
		// Verifica se a opção de arquivo físico está marcada.
		if (this.firstStepForm.get('isPhysicalFile')?.value) {
			// Exibe uma mensagem de erro e retorna se a opção de arquivo físico estiver marcada.
			let msg = `Não é possivel selecionar arquivo. Desmarque a opção de arquivo físico.`;
			this._snackBar.open(msg, 'Ok');
			console.error(msg);
			return;
		}

		// Obtém o arquivo selecionado ou null se nenhum arquivo for selecionado.
		const selectedFile = event.target.files[0] ?? null;
		// Obtém o elemento de input do arquivo.
		const fileInput = event.currentTarget as HTMLInputElement;

		// Verifica se um arquivo foi selecionado.
		if (selectedFile) {
			// Calcula o tamanho do arquivo em MB.
			const fileSizeInMB = selectedFile.size / (1024 * 1024);
			// Obtém o nome do arquivo.
			const fileName = selectedFile.name;

			// Define o regex para validar o nome do arquivo.
			const fileNameRegex = /^(?!\s*$)[^\\/:*?"<>|,]*$/;

			// Inicializa a mensagem de erro.
			let errorMessage = '';
			// Verifica se o tamanho do arquivo excede o limite máximo.
			if (fileSizeInMB >= this.maxFileSize)
				errorMessage += `Erro: Tamanho do arquivo excede o tamanho máximo permitido (${this.maxFileSize} MB) `;

			// Verifica se o nome do arquivo contém caracteres inválidos.
			if (!fileNameRegex.test(fileName))
				errorMessage += `Erro: Nome do arquivo contém símbolos não permitidos (\\/:*?"<>|,)`;

			// Exibe a mensagem de erro e limpa o input do arquivo caso hajam erros.
			if (errorMessage) {
				console.error(errorMessage);
				fileInput.value = '';
				this._snackBar.open(errorMessage, 'Ok');
				return;
			}

			// Obtém a contagem de páginas do arquivo e atualiza o formulário.
			this.getPageCount(selectedFile).subscribe({
				next: (fileProfile: FileProfile) => {
					// Atualiza a contagem de páginas no formulário.
					this.firstStepForm
						.get('pageCount')
						?.setValue(fileProfile.pageCount);
					// Atualiza o nome do arquivo no formulário.
					this.firstStepForm
						.get('fileName')
						?.setValue(fileProfile.fileName);
					// Atualiza o arquivo no formulário.
					this.firstStepForm.get('file')?.setValue(selectedFile);
				},
				error: () => {
					// Limpa o input do arquivo em caso de erro.
					fileInput.value = '';
				},
			});
		}
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
		const control = this.secondStepForm.get('pageIntervals');

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
			return `As páginas devem estar entre 1 e ${
				this.firstStepForm.get('pageCount')?.value
			}`;
		}

		// Retorna uma string vazia se nenhum erro for encontrado.
		return '';
	}

	/**
	 * Obtém a contagem de páginas de um arquivo PDF.
	 *
	 * Lê o arquivo como um ArrayBuffer, carrega o documento PDF e retorna um Observable
	 * com a contagem de páginas e o nome do arquivo.
	 *
	 * @param {File} file - O arquivo PDF a ser processado.
	 * @returns {Observable<FileProfile>} Um Observable contendo a contagem de páginas e o nome do arquivo.
	 */
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
							// Mensagem de erro para PDF encriptado.
							let encryptErrMsg =
								'Arquivo inválido ou encriptado. \
                                Porfavor, tente "Abrir o arquivo > Selecionar a opção Imprimir > Selecionar Salvar como PDF > Clicar em Salvar" \
                                e anexe o novo arquivo gerado';
							console.error(
								'Erro ao obter número de páginas: ' +
									encryptErrMsg,
								error
							);
							// Exibe um snackbar com a mensagem de erro.
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
					// Mensagem de erro para arquivo corrompido.
					let corruptErrMsg =
						'Erro: Não foi possivel ler o arquivo. PDF potencialmente corrompido';
					console.error(corruptErrMsg);
					// Exibe um snackbar com a mensagem de erro.
					this._snackBar.open(corruptErrMsg, 'Ok');
					observer.error('Não foi possível ler arquivo');
				}
			};
		});
	}

	/**
	 * Coleta as informações do formulário para criar um objeto CopyInterface.
	 *
	 * A função verifica se o formulário principal é válido e, em seguida,
	 * extrai os valores dos formulários dos passos 1 e 2 para construir
	 * o objeto CopyInterface que será enviado à requisição.
	 *
	 * @returns {CopyInterface | null} Retorna um objeto CopyInterface se o formulário for válido, ou null caso contrário.
	 */
	requestInfo(): CopyInterface | null {
		// Retorna null se o formulário principal não for válido.
		if (this.newCopyForm.invalid) return null;

		// Coleta as configurações de impressão do segundo passo do formulário.
		var printConfig: PrintConfig = {
			copyCount: this.secondStepForm.get('copyCount')?.value,
			pages: this.secondStepForm.get('pages')?.value,
			pageIntervals: this.secondStepForm.get('pageIntervals')?.value,
			pagesPerSheet: this.secondStepForm.get('pagesPerSheet')?.value,
			layout: this.secondStepForm.get('layout')?.value,
			sheetsTotal: this.newCopyForm.get('sheetsTotal')?.value,
			frontAndBack: this.secondStepForm.get('frontAndBack')?.value,
		};

		// Se é arquivo físico, inicializar um arquivo vazio com o nome sendo o rótulo fornecido
		// Caso contrário, manter o nome usual
		var isPhysicalFile: boolean =
			this.firstStepForm.get('isPhysicalFile')?.value;
		var file: File = isPhysicalFile
			? new File([], this.firstStepForm.get('fileName')?.value)
			: (this.firstStepForm.get('file')?.value as File);

		// Determina fileType caso seja arquivo físico
		var fileType = file.size > 0 ? file.type : 'Arquivo Físico';

		// Cria o objeto CopyInterface com as informações coletadas.
		var newCopyData: CopyInterface = {
			file: file,
			fileName: this.firstStepForm.get('fileName')?.value,
			fileType: fileType,
			pageCount: this.firstStepForm.get('pageCount')?.value,
			printConfig: printConfig,
			isPhysicalFile: isPhysicalFile,
			notes: this.newCopyForm.get('notes')?.value,
		};

		// Retorna o objeto CopyInterface criado.
		return newCopyData;
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
