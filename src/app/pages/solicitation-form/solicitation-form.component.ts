import {
	Component,
	HostListener,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditCopyBoxComponent } from '../../components/edit-copy-box/edit-copy-box.component';
import {
	actions,
	ActionService,
	ActionType,
	PageState,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { CopyInterface } from '../../models/copy.interface';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import {
	catchError,
	finalize,
	Observable,
	of,
	Subject,
	takeUntil,
	tap,
	throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigBoxComponent } from '../../components/config-box/config-box.component';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { NewCopyBoxComponent } from '../../components/new-copy-box/new-copy-box.component';
import { SolicitationInterface } from '../../models/solicitation.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import { SolicitationService } from '../../service/solicitation.service';
import { DialogDataResponse } from '../../models/dialogData.interface';
import { CanComponentDeactivate } from '../../guards/can-deactivate-form.guard';

@Component({
	selector: 'app-solicitation-form',
	imports: [
		MatButton,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		MatTableModule,
		MatIconModule,
		MatTooltipModule,
		MatButtonModule,
		MatSelectModule,
		MatChipsModule,
		IconPipe,
		MatProgressSpinnerModule,
	],
	templateUrl: './solicitation-form.component.html',
	styleUrl: './solicitation-form.component.scss',
})
export class SolicitationFormComponent
	implements OnDestroy, OnInit, CanComponentDeactivate
{
	// Serviços
	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	solicitationService = inject(SolicitationService);
	_snackBar = inject(MatSnackBar);
	route = inject(ActivatedRoute);
	router = inject(Router);

	/** Subject para desinscrever observables e prevenir memory leaks. */
	private ngUnsubscribe = new Subject<void>();

	/** Arquivos anexos da solicitação */
	files: File[] = [];

	/** Informações sobre as cópias anexas a solicitação */
	copies = new MatTableDataSource<CopyInterface>();

	/** Tipo de página atual. Este componente pode ser dois tipos de página: nova solicitação OU edição */
	pageState = PageState.newSolicitation;

	/** Título da página. Varia se a página é do tipo nova solicitação OU edição  */
	pageTitle: string = PageState.newSolicitation;

	/** Nome deste componente */
	componentName: string = 'solicitation-form';

	/** Ações permitidas na listagem de arquivos. Varia se a página é do tipo nova solicitação OU edição */
	allowedActions: ActionType[] = [];

	/** Usado em conjunto com o pipe de icone */
	configs = ActionType.CONFIGURACOES;

	/** Sinal para armazenar o número de arquivos selecionados. */
	fileCount = signal(0);

	/** Sinal para armazenar o contador de páginas da solicitação. */
	solicitationPageCounter = signal(0);

	/** Array de tempos para seleção de prazo. */
	times: number[] = [48, 24, 12, 4, 2];

	/** Controle para o número máximo de arquivos. */
	maxNumArchives = 10;

	/** Controle para o prazo selecionado, inicializado com o valor padrão do ambiente. */
	selectedTermControl = new FormControl(environment.DEFAULT_TERM_VALUE);

	/** Colunas a serem exibidas na tabela de cópias. */
	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'actions',
	];

	/** ID da solicitação a ser editada (undefined para nova solicitação). */
	editSolicitationId: number | undefined;
	currentSolicitation: SolicitationInterface | undefined;

	/** Sinal para indicar se o upload da solicitação está em andamento. */
	uploading = signal(false);

	/** Sinal para indicar se os dados estão sendo carregados. */
	loadingData = signal(false);

	/** Getter para o tipo de página de edição de solicitação. */
	public get editSolicitation(): PageState {
		return PageState.editSolicitation;
	}

	/**
	 * Método do ciclo de vida chamado na inicialização do componente.
	 *
	 * Determina o tipo de formulário (edição ou criação) com base na URL.
	 * Se for edição, carrega os dados da solicitação.
	 * Define as ações permitidas com base no tipo de página.
	 * Observa eventos de deleção e edição de cópias.
	 */
	ngOnInit(): void {
		// Determina o tipo de formulário: edição ou criação, com base na URL.
		let url = this.route.snapshot.url[0];
		this.pageState =
			url && url.path == 'editar'
				? PageState.editSolicitation
				: PageState.newSolicitation;

		// Define as ações permitidas com base no tipo de página.
		if (this.pageState == PageState.newSolicitation)
			this.allowedActions = actions.allowedActionsforNewSolicitation;
		else this.allowedActions = actions.allowedActionsforEditSolicitation;

		this.solicitationService.canRedirect = true;

		this.selectedTermControl.valueChanges
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe(() => {
				this.solicitationService.canRedirect = false;
			});

		// Observar eventos de deleção e edição
		this.actionService.deleteCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.removeCopy(copy);
			});
		this.actionService.editCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.editCopyDialog(copy);
			});
		this.actionService.showCopyConfigs
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy: CopyInterface) => {
				this.showConfigs(copy);
			});

		// Se a página for de edição, carrega os dados da solicitação.
		if (this.pageState == PageState.editSolicitation) {
			this.editSolicitationId = +this.route.snapshot.paramMap.get('id')!;
			this.pageTitle =
				this.pageState +
				' Nº ' +
				this.editSolicitationId.toString().padStart(6, '0');
			this.loadingData.set(true);

			// Obtém os dados da solicitação do serviço.
			this.solicitationService
				.getSolicitationById(this.editSolicitationId)
				.pipe(
					finalize(() => {
						this.loadingData.set(false);
					})
				)
				// Atualiza a página com os dados da solicitação.
				.subscribe({
					next: (solicitation: SolicitationInterface) => {

						// Verifica se a solicitação existe e não está concluída ou arquivada.
						// Se for o caso, redireciona o usuário para a página inicial.
						if (!solicitation || solicitation.conclusionDate || solicitation.archived) {
							this.router.navigate(['']);
							return;
						}

						this.currentSolicitation = solicitation;
						if (solicitation.copies)
							this.copies.data = solicitation.copies;
						this.selectedTermControl.setValue(
							solicitation.deadline, {emitEvent: false}
						);
						// this.refreshTable();
					},
					error: (error) => {
						console.error(error);

						// Falha ao buscar solicitação, redirecione o usuário
						this.router.navigate(['']);
					},
				});
		}
	}

	/**
	 * Remove uma cópia específica da lista de cópias.
	 *
	 * Abre um diálogo de confirmação antes de remover a cópia.
	 * Se a cópia for a última da lista e a página for de edição,
	 * a solicitação inteira será removida.
	 *
	 * @param {CopyInterface} copy A cópia a ser removida.
	 */
	removeCopy(copy: CopyInterface): void {
		// Verifica se a cópia é a última da lista e se a página é de edição.
		let isLastCopy =
			this.pageState == this.editSolicitation &&
			this.copies.data.length == 1;
		let lastCopyMessage = isLastCopy
			? 'Esta é a única cópia e a solicitação também será removida. '
			: '';

		// Abre um diálogo de confirmação para remover a cópia.
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir cópia',
				message:
					"Deseja realmente excluir cópia de '" +
					copy.fileName +
					"'?",
				warning: lastCopyMessage + 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.subscribe((dialog: DialogDataResponse) => {
				if (!dialog.confirmation) return;

				// Se a cópia for a última, remove a solicitação inteira.
				if (isLastCopy) {
					this.solicitationService
						.removeSolicitationById(
							this.editSolicitationId!,
							dialog.sendNotification
						)
						.subscribe((response: string) => {
							this._snackBar.open(response, 'Ok');
							this.router.navigate([
								this.actionService.getLastPageState(true) ||
									'nova-solicitacao',
							]);
						});
					// Remove a cópia da lista.
				} else {
					const copyIndex = this.copies.data.indexOf(copy);

					if (copyIndex >= 0) {
						this.copies.data.splice(copyIndex, 1);
						this.files.splice(copyIndex, 1);

						this.refreshTable();
					}
				}
			});
	}

	/**
	 * Retorna o índice de uma cópia existente com o mesmo nome e intervalos de página na lista de cópias anexadas.
	 * Se não existir uma cópia correspondente, retorna -1.
	 *
	 * @param name - O nome do arquivo para comparar
	 * @param pageIntervals - A string de intervalos de página para comparar
	 * @param id - O índice (id) da cópia sendo editada (se aplicável)
	 * @param editing - Se estamos no modo de edição
	 * @param relativePosition - A posição da cópia sendo editada no array de cópias
	 * @returns O índice da cópia correspondente ou -1 se nenhuma correspondência for encontrada
	 */
	private findExistingCopyIndex(
		name: string,
		pageIntervals?: string,
		id?: number,
		editing?: boolean,
		relativePosition?: number
	): number {
		const copies: CopyInterface[] = this.copies.data;

		for (let i = 0; i < copies.length; i++) {
			const currCopy = copies[i];

			// Verifica se os nomes correspondem
			const namesMatch = currCopy.fileName === name;

			// Verifica se os intervalos de página correspondem (ou ambos são iguais ou ambos são undefined/null)
			const intervalsMatch =
				currCopy.printConfig.pageIntervals === pageIntervals ||
				(!currCopy.printConfig.pageIntervals && !pageIntervals);

			if (namesMatch && intervalsMatch) {
				// Se não estiver no modo de edição, encontramos uma correspondência
				if (!editing) {
					return i;
				}

				// Lida com a lógica de edição com casos especiais
				const samePosition = i === relativePosition;
				const bothHaveIds = id && currCopy.id;
				const neitherHaveIds = !id && !currCopy.id;
				const mixedIdStatus =
					(id && !currCopy.id) || (!id && currCopy.id);

				if ((bothHaveIds || neitherHaveIds) && samePosition) {
					return -1; // Mesma posição, então é o item sendo editado
				}

				if (bothHaveIds || neitherHaveIds || mixedIdStatus) {
					return i;
				}
			}
		}

		return -1; // Nenhuma correspondência encontrada
	}

	/**
	 * Abre um diálogo para editar as configurações de uma cópia existente.
	 *
	 * Permite ao usuário modificar as observações e configurações de impressão da cópia.
	 * Verifica se a cópia editada já existe na lista e, se sim, oferece a opção de sobrescrevê-la.
	 *
	 * @param {CopyInterface} copy A cópia a ser editada.
	 */
	editCopyDialog(copy: CopyInterface): void {
		// Abre o diálogo de edição de cópia.
		this.dialogService
			.openDialog(EditCopyBoxComponent, {
				title: 'Editar cópia',
				data: copy,
				positive_label: 'Confirmar',
				negative_label: 'Cancelar',
			})
			.afterClosed()
			.subscribe((result: FormGroup) => {
				if (!result) return;

				const editedParts = result.value;

				// Caso exista, formatar intervalo de páginas (string) para sempre ter UM espaço depois da vírgula ", " (padrão)
				let interval = editedParts.pageIntervals;
				if (interval)
					editedParts.pageIntervals = interval.replace(/,\s*/g, ', ');

				const copyIndex = this.copies.data.indexOf(copy);

				// Função para atualizar a cópia na lista.
				const updateCopy = (indexToRemove?: number) => {
					if (copyIndex >= 0) {
						// Atualiza as observações e remove do objeto temporário
						this.copies.data[copyIndex].notes = editedParts.notes;
						delete editedParts.notes;

						// Atualiza configurações de impressão
						this.copies.data[copyIndex].printConfig = {
							...this.copies.data[copyIndex].printConfig,
							...editedParts,
						};

						// Remove o intervalo de páginas se a opção "Todas" for selecionada.
						if (
							this.copies.data[copyIndex].printConfig.pages ===
							'Todas'
						)
							this.copies.data[
								copyIndex
							].printConfig.pageIntervals = undefined;
					}

					// Remove a cópia repetida, se necessário.
					if (indexToRemove != undefined) {
						this.copies.data.splice(indexToRemove, 1);
						this.files.splice(indexToRemove, 1);
					}

					this.refreshTable();
				};

				// Encontrar cópia repetida, caso exista
				const existingCopyIndex = this.findExistingCopyIndex(
					copy.fileName,
					editedParts.pageIntervals,
					copy.id,
					true,
					copyIndex
				);

				// Função para processar cópia durante edição
				// Pode: (atualizar) OU (atualizar E remover cópia repetida)
				const processCopy = () => {
					if (existingCopyIndex !== -1) {
						let copy = this.copies.data[existingCopyIndex];
						this.dialogService
							.openDialog(DialogBoxComponent, {
								title: 'Sobreescrever cópia',
								message: `Já existe uma cópia com o nome '${
									copy.fileName
								}'${
									copy.printConfig.pageIntervals
										? " e mesmo intervalo '" +
										  copy.printConfig.pageIntervals +
										  "'"
										: ''
								} nesta solicitação. Deseja sobreescrever?`,
								warning: 'Esta ação é permanente',
								positive_label: 'Sim',
								negative_label: 'Não',
							})
							.afterClosed()
							.subscribe((shouldRewrite: boolean) => {
								// Atualizar removendo cópia repetida, somente após confirmação do usuário
								if (shouldRewrite)
									updateCopy(existingCopyIndex);
							});
					} else {
						updateCopy();
					}
				};
				// Inicia o processamento da cópia editada.
				processCopy();
			});
	}

	/**
	 * Abre um diálogo para adicionar uma nova cópia ou editar uma cópia existente.
	 *
	 * Permite ao usuário definir as configurações da nova cópia, incluindo o arquivo,
	 * intervalo de páginas e outras opções de impressão.
	 * Verifica se a cópia a ser adicionada já existe na lista e, se sim,
	 * oferece a opção de sobrescrevê-la.
	 *
	 * @param {CopyInterface} [data] Dados da cópia a serem editados (opcional).
	 */
	addCopyDialog(data?: CopyInterface): void {
		// Desabilitar adições caso a solicitação esteja concluída
		if (!!this.currentSolicitation?.conclusionDate) return;

		// Mostrar aviso caso já existam numMaxArchives anexados
		if (this.copies.data.length >= this.maxNumArchives) {
			this._snackBar.open(
				`Número máximo de arquivos por solicitação (${this.maxNumArchives}) atingido.`,
				'Ok'
			);
			return;
		}

		// Abre o diálogo para adicionar ou editar uma cópia.
		this.dialogService
			.openDialog(
				NewCopyBoxComponent,
				{
					data: data,
					positive_label: 'Finalizar',
				},
				true
			)
			.afterClosed()
			.subscribe((result: CopyInterface | null) => {
				if (!result) return;

				// Caso seja arquivo digital, verifica se este foi anexado
				if (!result.isPhysicalFile && !result.file) {
					let msg = 'Erro: Nenhum arquivo anexado.';
					this._snackBar.open(msg, 'Ok');
					console.error(msg);
					return;
				}

				// Caso exista, formatar intervalo de páginas (string) para sempre ter UM espaço depois da vírgula ", " (padrão)
				let interval = result.printConfig.pageIntervals;
				if (interval)
					result.printConfig.pageIntervals = interval.replace(
						/,\s*/g,
						', '
					);

				// Encontrar cópia repetida, caso exista
				const existingCopyIndex = this.findExistingCopyIndex(
					result.file.name,
					result.printConfig.pageIntervals
				);

				// Função para adicionar ou atualizar a cópia na lista.
				const addOrUpdateCopy = (index?: number) => {
					if (index !== undefined) {
						this.copies.data[index] = result;
						this.files[index] = result.file;
					} else {
						this.copies.data.push(result);
						this.files.push(result.file);
					}
					this.refreshTable();
				};

				// Função de processamento da cópia a ser adicionada.
				const processCopy = () => {
					// Se a cópia já existir, oferece a opção de sobrescrevê-la.
					if (existingCopyIndex !== -1) {
						let copy = this.copies.data[existingCopyIndex];
						this.dialogService
							.openDialog(DialogBoxComponent, {
								title: 'Sobreescrever cópia',
								message: `Já existe uma cópia com o nome '${
									copy.fileName
								}'${
									copy.printConfig.pageIntervals
										? " e mesmo intervalo '" +
										  copy.printConfig.pageIntervals +
										  "'"
										: ''
								} nesta solicitação. Deseja sobreescrever?`,
								warning: 'Esta ação é permanente',
								positive_label: 'Sim',
								negative_label: 'Não',
							})
							.afterClosed()
							.subscribe((shouldRewrite: boolean) => {
								// Se o usuário confirmar a sobrescrita, atualiza a cópia existente.
								if (shouldRewrite)
									addOrUpdateCopy(existingCopyIndex);
								// Se o usuário não confirmar, abre o diálogo novamente.
								else this.addCopyDialog(result);
							});
					} else {
						// Se a cópia não existir, adiciona a nova cópia.
						addOrUpdateCopy();
					}
				};

				// Inicia o processamento da cópia editada.
				processCopy();
			});
	}

	/**
	 * Abre um diálogo para confirmar a remoção de todas as cópias da lista.
	 *
	 * Exibe um diálogo de confirmação com o número de cópias a serem removidas.
	 * Se o usuário confirmar, chama o método `clearCopies()` para remover as cópias.
	 */
	clearCopiesDialog(): void {
		// Verifica se existem cópias na lista.
		if (this.anyCopiesAttached()) {
			// Abre um diálogo de confirmação para remover todas as cópias.
			this.dialogService
				.openDialog(DialogBoxComponent, {
					title: 'Limpar Cópias',
					message: `Deseja realmente excluir todas as [${this.copies.data.length}] cópias anexadas?`,
					warning: 'Esta ação é permanente',
					positive_label: 'Sim',
					negative_label: 'Não',
				})
				.afterClosed()
				.subscribe((result: boolean) => {
					if (result) this.clearCopies();
				});
		}
	}

	/**
	 * Abre um diálogo para exibir as configurações de impressão de uma cópia específica.
	 *
	 * Exibe um diálogo com as configurações de impressão da cópia, como intervalo de páginas,
	 * tipo de impressão e outras opções.
	 *
	 * @param {CopyInterface} copy A cópia para exibir as configurações de impressão.
	 */
	showConfigs(copy: CopyInterface): void {
		this.dialogService.openDialog(ConfigBoxComponent, {
			title: 'Configurações de Impressão',
			data: copy,
			positive_label: 'Ok',
		});
	}

	/**
	 * Limpa a lista de cópias e redefine o prazo selecionado para o valor padrão.
	 *
	 * Remove todas as cópias da lista `this.copies.data` e limpa o array de arquivos `this.files`.
	 * Redefine o valor do controle de prazo selecionado (`this.selectedTermControl`)
	 * para o valor padrão definido no ambiente (`environment.DEFAULT_TERM_VALUE`).
	 * Atualiza a tabela de cópias.
	 */
	clearCopies(): void {
		this.copies.data = [];
		this.files = [];
		this.selectedTermControl.setValue(environment.DEFAULT_TERM_VALUE);

		this.refreshTable();
	}

	/**
	 * Atualiza a tabela de cópias e o contador de páginas da solicitação.
	 *
	 * Força a atualização da tabela de cópias, atualiza o contador de arquivos
	 * e calcula o número total de páginas da solicitação com base nas cópias.
	 */
	refreshTable(): void {
		// Atualizar objeto data source de cópias da tabela
		// "Angular Material is weird"
		this.copies.data = this.copies.data;

		this.fileCount.set(this.copies.data.length);

		// Calcula o número total de páginas da solicitação.
		var counter = 0;
		this.copies.data.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		this.solicitationPageCounter.set(counter);
		this.solicitationService.canRedirect = false;	
	}

	/**
	 * Envia a solicitação com os arquivos e cópias anexadas.
	 *
	 * Verifica se a solicitação já foi concluída antes de enviar.
	 * Se não houver cópias anexadas ou arquivos, exibe uma mensagem de erro.
	 * Caso contrário, chama o serviço de solicitação para enviar os dados.
	 */
	submitSolicitation(): void {
		if (this.currentSolicitation?.conclusionDate) {
			console.warn('Solicitação já concluída, não é possível editar.');
			return;
		}

		// Define o status de upload como verdadeiro.
		// Este primeiro gerencia o DOM do componente atual
		this.uploading.set(true);

		// Este segundo é um sinal global que pode ser acessado por outros componentes
		// E.g. o botão de logout
		this.solicitationService.canRedirect = false;

		const solicitationObservable$ = this.getSolicitationObservable();

		solicitationObservable$
			.pipe(
				tap((response: any) => {
					// Add a type for response if possible
					if (response) {
						// Ensure response is not null (from handled errors)
						this.handleSuccessfulSubmission(response);
					}
				}),
				catchError((error: Error) => this.handleSubmissionError(error)),
				finalize(() => {
					this.uploading.set(false);
				})
			)
			.subscribe();
	}

	private getSolicitationObservable(): Observable<any> {
		// Add a more specific type than 'any' if possible
		const commonPayload = {
			files: this.files,
			copies: this.copies.data,
			term: this.selectedTermControl.value ?? 24, // Use nullish coalescing for default
			pageCounter: this.solicitationPageCounter(),
		};

		switch (this.pageState) {
			case PageState.newSolicitation:
				if (!this.anyCopiesAttached() || this.files.length === 0) {
					const errorMessage =
						'É necessário adicionar pelo menos uma cópia à solicitação';
					this.showErrorSnackbar(errorMessage);
					this.solicitationService.canRedirect = true; // Reset
					return throwError(() => new Error(errorMessage));
				}
				return this.solicitationService.saveSolicitation(
					commonPayload.files,
					commonPayload.copies,
					commonPayload.term,
					commonPayload.pageCounter
				);

			case PageState.editSolicitation:
				if (!this.editSolicitationId) {
					const errorMessage =
						'ID da solicitação para edição não encontrado.';
					this.showErrorSnackbar(errorMessage);
					this.solicitationService.canRedirect = true; // Or handle as a more critical error
					return throwError(() => new Error(errorMessage));
				}
				return this.solicitationService.editSolicitation(
					this.editSolicitationId,
					commonPayload.files,
					commonPayload.copies,
					commonPayload.term,
					commonPayload.pageCounter
				);

			default:
				const errorMessage = 'Tipo de página inválido.';
				this.showErrorSnackbar(errorMessage); // Potentially no snackbar if this is a programmatic error
				this.solicitationService.canRedirect = true; // Reset
				console.error(errorMessage, 'Page state:', this.pageState); // Log for debugging
				return throwError(() => new Error(errorMessage));
		}
	}

	private handleSuccessfulSubmission(response: { id: number }): void {
		this._snackBar.open(
			`Cadastro bem sucedido (ID: ${response.id
				.toString()
				.padStart(6, '0')})`,
			'Ok'
		);
		this.clearCopies();
		this.solicitationService.canRedirect = true; // Reset as per original logic
		this.router.navigate([
			this.actionService.getLastPageState(true) || 'minhas-solicitacoes',
		]);
	}

	private handleSubmissionError(error: Error): Observable<null> {
		console.error('Submission error:', error);
		this.showErrorSnackbar(
			error.message || 'Ocorreu um erro na submissão.'
		);
		this.solicitationService.canRedirect = true; // Reset as per original logic
		return of(null); // Return a "successful" observable to allow finalize to run
		// and prevent the main stream from erroring out if not desired.
	}

	private showErrorSnackbar(message: string): void {
		this._snackBar.open(message, 'Ok');
	}

	/**
	 * Verifica se existem cópias anexadas.
	 *
	 * @returns {boolean} Retorna `true` se houver pelo menos uma cópia anexada, caso contrário, retorna `false`.
	 */
	anyCopiesAttached(): boolean {
		return this.copies.data.length > 0;
	}

	/**
	 * Navega para a rota especificada.
	 *
	 * @param {string} route A rota para a qual navegar. Se `undefined`, a navegação não ocorre.
	 * @returns {void}
	 */
	navigateTo(route?: string): void {
		if (route) {
			this.router.navigate([route]);
		}
	}

	// Verifica se o usuário pode sair da página atual.
	canDeactivate():
		| Observable<boolean | UrlTree>
		| Promise<boolean | UrlTree>
		| boolean
		| UrlTree {
		if (!this.solicitationService.canRedirect) {
			return confirm(
				'Você tem alterações não salvas. Deseja realmente sair?'
			);
		}
		return true;
	}

	// Lidar com o fechamento da aba/janela do navegador
	@HostListener('window:beforeunload', ['$event'])
	unloadNotification($event: any): void {
		if (!this.solicitationService.canRedirect) {
			$event.returnValue = true; // Exibe o aviso de saída
		}
	}

	/**
	 * Método do ciclo de vida chamado quando o componente é destruído.
	 *
	 * Desinscreve observables para prevenir memory leaks.
	 */
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
